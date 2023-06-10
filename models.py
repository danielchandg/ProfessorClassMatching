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
                Field('user_id', 'reference auth_user', default=get_user_id),
                Field('matching_ids', 'list:integer', default=[]),
                Field('tutorial', 'list:string', default=[]) # What tutorial pop-ups the user has encountered
                )

# This table stores the matchings of all users.
# Note one user can create multiple matchings.
db.define_table('matchings',
                Field('user_id', 'reference auth_user', default=get_user_id),
                Field('name'),
                Field('description'),
                Field('num_quarters', 'integer', requires=IS_INT_IN_RANGE(1, 100)), # Number of quarters in this matching
                Field('quarter_names', 'list:string'), # List of quarter names for this matching
                Field('time_created'), # This field is a string served from index.js
                )

# This table stores all classes of all matchings of all users.
db.define_table('classes',
                Field('name'),
                Field('matching_id', 'reference matchings'),
                Field('description'),
                Field('num_sections', 'list:integer'), # Number of sections for this class in each quarter
                Field('time_created') # Fieldname 'created_on' wasn't working for some reason
                )

# This table stores all professors of all matchings of all users.
db.define_table('professors',
                # This is 'name_' instead of 'name' because py4web was throwing this error for some reason:
                ### sqlite3.IntegrityError: UNIQUE constraint failed: professors.name ###
                # Even though 'name' was working for both db.matchings and db.classes
                Field('name_'),
                Field('matching_id', 'reference matchings'),
                Field('description'),
                Field('time_created')
                )

# This table stores all requested classes of all professors.
db.define_table('class_requests',
                Field('matching_id', 'reference matchings'),
                Field('professor_id', 'reference professors'),
                Field('class_id', 'reference classes'),
                Field('quarter', 'integer') # 0-indexed
                )

# This table stores all class/professor/quarter matches of all matchings of all users.
db.define_table('matches',
                Field('matching_id', 'reference matchings'),
                Field('class_id', 'reference classes'), # ID of the class this belongs to
                Field('professor_id', 'reference professors'),
                Field('quarter', 'integer'), # Which quarter is this match in
                Field('time_created')
                )

db.commit()
