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


# This table stores the settings of all users.
# For example, suppose user 'alice' has matchings corresponding to the 1st, 4th, and 6th entry in the matchings table.
# Then her 'matching_ids' should be [1,4,6].
db.define_table('settings',
                Field('user_id', 'reference auth_user', default=get_user_id, writable=False),
                Field('matching_ids', 'list:integer', default=[])
                )

# This table stores the matchings of all users.
# Note one user can create multiple matchings.
db.define_table('matchings',
                Field('user_id', 'reference auth_user', default=get_user_id, writable=False),
                Field('name', default=''),
                Field('description', default=''),
                # Field('quarters', 'list:string', default=['fall', 'winter', 'spring', 'summer']),
                Field('created_on', default=get_time, readable=False, writable=False)
                )

# This table stores all classes of all matchings of all users.
db.define_table('classes',
                Field('matching_id', 'reference matchings', writable=False), # ID of the matching the class belongs to
                Field('name', default='', unique=True, requires=IS_NOT_EMPTY()),
                Field('fall', 'integer', default=0, requires=IS_INT_IN_RANGE(0, 100)),
                Field('winter', 'integer', default=0, requires=IS_INT_IN_RANGE(0, 100)),
                Field('spring', 'integer', default=0, requires=IS_INT_IN_RANGE(0, 100)),
                Field('summer', 'integer', default=0, requires=IS_INT_IN_RANGE(0, 100)),
                Field('link', default=''),
                Field('description', default=''),
                Field('created_on', 'datetime', default=get_time, readable=False, writable=False)
                )

# This table stores all professors of all matchings of all users.
db.define_table('professors',
                Field('matching_id', 'reference matchings', writable=False), # ID of the matching the professor belongs to
                Field('name', default='', unique=True, requires=IS_NOT_EMPTY()),
                Field('fall', 'list:string', default=[]), # List of classes the professor may teach in the fall
                Field('winter', 'list:string', default=[]),
                Field('spring', 'list:string', default=[]),
                Field('summer', 'list:string', default=[]),
                Field('link', default=''),
                Field('created_on', 'datetime', default=get_time, readable=False, writable=False)
                )

# This table stores all class/professor/quarter matches of all matchings of all users.
db.define_table('matches',
                Field('matching_id', 'reference matchings', writable=False), # ID of the matching this belongs to
                Field('Class', default='', requires=IS_NOT_EMPTY()), # 'class' is a reserved fieldname
                Field('Professor', default='', requires=IS_NOT_EMPTY()),
                Field('Quarter', default='', requires=IS_IN_SET(['fall', 'winter', 'summer', 'spring'])),
                Field('created_on', 'datetime', default=get_time, readable=False, writable=False)
                )

db.matchings.id.readable = db.matchings.id.writable = False
db.classes.id.readable = db.classes.id.writable = False
db.professors.id.readable = db.professors.id.writable = False
db.matches.id.readable = db.matches.id.writable = False

db.commit()
