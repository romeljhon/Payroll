from drf_spectacular.utils import extend_schema
from .serializers import PositionSerializer
from .models import Position
from rest_framework import viewsets

# Create your views here.
@extend_schema(tags=["Positions"])
class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer