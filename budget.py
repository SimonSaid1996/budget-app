import time
import os
from hashlib import md5
from datetime import datetime
from flask import Flask, request, session, url_for, redirect, render_template, abort, g, flash, _app_ctx_stack
from flask_restful import Resource, Api
from werkzeug import check_password_hash, generate_password_hash	 
from flask_restful import reqparse, abort, Api, Resource


# create our little application :)
app = Flask(__name__)
api = Api(app)

app.config.update(dict(SEND_FILE_MAX_AGE_DEFAULT=0))

CATEGORIES = {	 }
PURCHASE = {}
#the next step is to change the todo into the user_ids, so that later only the user who created the room can delete it
#need to somehow send the user's id via json to the js file

SECRET_KEY = 'development key'


app.config.from_object(__name__)
app.config.from_envvar('MINITWIT_SETTINGS', silent=True)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

#db.init_app(app)


def abort_if_cat_doesnt_exist(cat_id):
	if cat_id not in CATEGORIES:
		abort(404, message="category {} doesn't exist".format(cat_id))

def abort_if_pur_doesnt_exist(pur_id):
	if pur_id not in PURCHASE:
		abort(404, message="purchase {} doesn't exist".format(pur_id))
		
		
parser = reqparse.RequestParser()
parser.add_argument('task')



class categories(Resource):
	def get(self, cat_id):					#definining one controller for each restful operations
		abort_if_cat_doesnt_exist(cat_id)
		return CATEGORIES[cat_id]

	def delete(self, cat_id):
		abort_if_cat_doesnt_exist(cat_id)
		del CATEGORIES[cat_id]
		return '', 204

	def put(self, cat_id):						#why is there a chatroomid here and the mothod still works 
		args = parser.parse_args()
		task = {'task': args['task']}
		CATEGORIES[cat_id] = task
		return task, 201



class category_list(Resource):
	def get(self):
		return CATEGORIES

	#need to think more about the null case, the when the chatroom is null, the chatroom	
	def post(self):
		args = parser.parse_args()
		if CATEGORIES:
			cat_id = len(CATEGORIES)
			#cat_id = int(max(CATEGORIES.keys()).lstrip('category')) + 1			#honestly, the id here is changeable, dones't really need to have the same name, think about how
			#cat_id = 'category%i' % cat_id
		else:
			cat_id = '0'#'category1' 												#for the empty array situation			
		
		CATEGORIES[cat_id] = {'task': args['task']}				#here is the place where you input the newmemssages, or just set message class as a list of strings?
		return CATEGORIES[cat_id], 201		#can specify the status code, like created, remove and ok
		
###############################		
class purchases(Resource):
	def get(self, pur_id):					#definining one controller for each restful operations
		abort_if_pur_doesnt_exist(pur_id)
		return PURCHASE[pur_id]

	def delete(self, pur_id):
		print("pur_id is ",pur_id);
		abort_if_pur_doesnt_exist(pur_id)
		del PURCHASE[pur_id]
		return '', 204

	def put(self, pur_id):						#why is there a chatroomid here and the mothod still works 
		args = parser.parse_args()
		task = {'task': args['task']}
		PURCHASE[pur_id] = task
		return task, 201



class purchase_list(Resource):
	def get(self):
		return PURCHASE

	#need to think more about the null case, the when the chatroom is null, the chatroom	
	def post(self):
		args = parser.parse_args()				#just change the int into len or something
		
		if PURCHASE:
			pur_id = len(PURCHASE)#pur_id=int(max(PURCHASE.keys()).lstrip('purchase')) + 1			#honestly, the id here is changeable, dones't really need to have the same name, think about how
			
		else:
			pur_id = '0'
			
		PURCHASE[pur_id] = {'task': args['task']}				#here is the place where you input the newmemssages, or just set message class as a list of strings?
		return PURCHASE[pur_id], 201		#can specify the status code, like created, remove and ok
		



#might want to consider getting rid of the get_id methods, kind of useless here 	



def gravatar_url(email, size=80):
	"""Return the gravatar image for the given email address."""
	return 'http://www.gravatar.com/avatar/%s?d=identicon&s=%d' % \
		(md5(email.strip().lower().encode('utf-8')).hexdigest(), size)
		

@app.route('/')
def userInterface():	
	return render_template('userInterface.html' )
	

	
	
app.jinja_env.filters['gravatar'] = gravatar_url
api.add_resource(category_list, '/cats')
api.add_resource(categories, '/cats/<cat_id>')

api.add_resource(purchase_list, '/purchases')
api.add_resource(purchases, '/purchases/<pur_id>')



if __name__ == '__main__':
	app.run(debug=True)
