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
from py4web.utils.form import Form, FormStyleBulma
from py4web.utils.url_signer import URLSigner
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from .models import get_user_email

url_signer = URLSigner(session)

@action('index', method=['GET', 'POST'])
@action.uses('index.html', db, auth.user, session, url_signer)
def index():
    # If user is not logged in, should redirect to login page.
    # Otherwise, should be the home page for the user.
    # Here, the user can:
    # 1) Create a new matching
    # 2) Select a previously created matching
    # 3) Delete a matching

    # TODO: Change formstyle to something customized
    # TODO: Change form name to default as 'Matching 1', 'Matching 2', etc.
    form = Form(db.matchings, csrf_session=session, formstyle=FormStyleBulma)

    if form.accepted:
        # TODO: Use form.vars['id'] to update db.settings
        # Should redirect to '/matching/<form.vars['id']> so user can immediately start adding classes/professors
        pass

    elif form.errors:
        # TODO: Display error message
        pass
    
    # This dict() should contain all matchings for this user as well
    return dict(form=form)

# The url '/matching' for now just redirects to home page
@action('matching')
def tail():
    redirect(URL(''))

# Note: Matching_id is the ID of the matching for the user, not the global matching ID.
# Thus, every user should be able to use the url '/matching/1'
@action('matching/<matching_id:int>')
@action.uses('matching.html', db, auth.user, session, url_signer)
def matching(matching_id=None):
    return dict(matching_id=matching_id)

# This route is whenever the user edits any part of a matching.
# - Add/Edit/Delete a class
# - Add/Edit/Delete a professor
# - Add/Edit/Delete a match
@action('matching/<matching_id:int>', method=['POST'])
@action.uses(db, auth.user, session, url_signer.verify())
def edit_matching(matching_id=None):
    redirect(URL(f'matching/{matching_id}'))

# This route is whenever the user deletes a matching.
@action('matching/<matching_id:int>', method=['DELETE'])
@action.uses(db, auth.user, session, url_signer.verify())
def delete_matching(matching_id=None):
    redirect(URL(f'matching/{matching_id}'))