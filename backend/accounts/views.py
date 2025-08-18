from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from drf_spectacular.utils import extend_schema
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.conf import settings
from django.contrib.auth.models import User

@extend_schema(tags=["Accounts"])
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(request, email=email, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key}, status=status.HTTP_200_OK)

@extend_schema(tags=["Accounts"])
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'success': 'Logged out successfully'}, status=status.HTTP_200_OK)

@extend_schema(tags=["Accounts"])
class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not user.check_password(current_password):
            return Response({'error': 'Incorrect current password'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Optional: force new login/token
        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)

        return Response({'success': 'Password changed successfully', 'token': new_token.key}, status=status.HTTP_200_OK)

@extend_schema(tags=["Accounts"])
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        first_name = (request.data.get("first_name") or "").strip()
        last_name = (request.data.get("last_name") or "").strip()

        # Basic presence checks
        if not email or not password:
            return Response({"error": "Email and password are required."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Email format
        try:
            validate_email(email)
        except ValidationError:
            return Response({"error": "Invalid email address."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Unique email (case-insensitive)
        if User.objects.filter(email__iexact=email).exists():
            return Response({"error": "Email already in use."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Password strength (uses AUTH_PASSWORD_VALIDATORS)
        try:
            validate_password(password)
        except ValidationError as e:
            return Response({"error": "Invalid password.", "reasons": e.messages},
                            status=status.HTTP_400_BAD_REQUEST)

        # Create user — default User uses username; we set it to email
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        # Apply default active flag from settings
        default_active = getattr(settings, "REGISTER_DEFAULT_ACTIVE", True)
        if user.is_active != default_active:
            user.is_active = default_active
            user.save(update_fields=["is_active"])

        # Issue DRF token
        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "message": "Registered successfully.",
                "token": token.key,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_active": user.is_active,
                    "date_joined": user.date_joined,
                },
            },
            status=status.HTTP_201_CREATED
        )