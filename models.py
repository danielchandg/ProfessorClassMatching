"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_user_id():
    return auth.current_user.get('id') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later

db.define_table('poker',
                Field('secret'),
                Field('content', 'text'),
                Field('number_of_days', 'integer')
)

db.define_table('pets',
                Field('species', requires=IS_IN_SET(['Cat', 'Dog'])),
                Field('number_of_paws', 'integer', default=4),
                Field('description', 'text'),
                Field('created_on', 'datetime', default=get_time),
                Field('created_by_email', default=get_user_email), # We set default as a function
                # If the user ID was deleted from the auth_user table, the pet in this table should not be deleted
                Field('created_by_id', "reference auth_user", default=get_user_id, ondelete='SET NULL'),
)

db.pets.created_on.readable = False
db.pets.created_on.writable = False

db.commit()
