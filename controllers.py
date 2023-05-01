"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email
import random
import uuid
import json

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, session, auth)
def index():
    print("User:", get_user_email())
    c = session.get('num_visits', 0)
    c += 1
    session['num_visits'] = c
    return dict(num_visits=c)

@action('simple')
@action.uses('simple.html', auth.user)
def simple():
    r = random.randint(0, 10)
    return dict(r=r)

# Session tracker using db
# If no session is detected, gives the browser a session ID and a corresponding db entry
# Files modified: controllers.py, models.py, oldie.html
# Considerations: Multiple tabs have different session IDs.
# Use cookies so multiple tabs share the same session ID.
@action('oldie')
@action.uses('oldie', db)
def oldie():
    # Get the session ID
    s = request.params.get('s')
    if s is None:
        # Create a session ID
        s = uuid.uuid1()
        redirect(URL('oldie', vars=dict(s=s)))
    
    c = db(db.poker.secret == s).select().first()
    if c is None:
        d = {}
    else:
        d = json.loads(c.content)
    # d is the session contents of the session ID (e.g. uuid, user, cookies, num_visits)
    counter = d.get('counter', 0)
    counter += 1
    d['counter'] = counter
    # Store d back to the database
    if c is None:
        db.poker.insert(secret=s, content=json.dumps(d))
    else:
        db(db.poker.secret == s).update(content=json.dumps(d))
    return dict(counter=counter)

@action('add', method=["GET", "POST"])
@action.uses('add.html', url_signer, db, session, auth.user)
def add():
    form = Form(db.product, csrf_session=session, formstyle=FormStyleBulma)