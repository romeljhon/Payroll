# accounts/backends.py
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q # Import Q for OR queries

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        
        # When authenticate is called with email=email, the 'email' will be in kwargs
        # So we need to look for it there, or fall back to 'username' if it's passed that way
        lookup_value = kwargs.get('email', username)
        
        if not lookup_value:
            return None # No email or username provided

        try:
            # Try to fetch the user by email (case-insensitive) OR by username (case-insensitive)
            # This makes it flexible for existing users who might have username as their email
            user = UserModel.objects.get(Q(email__iexact=lookup_value) | Q(username__iexact=lookup_value))
        except UserModel.DoesNotExist:
            return None # User not found by email or username

        # Check the password and ensure the user is active
        if user.check_password(password) and self.user_can_authenticate(user):
            return user # Authentication successful
        return None # Password mismatch or user is inactive

    def get_user(self, user_id):
        # This method is crucial for session-based authentication (like Django Admin)
        # to retrieve the user by ID after they've been authenticated.
        UserModel = get_user_model()
        try:
            return UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None