
from django.core.management.base import BaseCommand
from email_sender.views import send_email

class Command(BaseCommand):
    help = '''Sends a test email to the specified address to verify Brevo integration.'''

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='The recipient email address.')

    def handle(self, *args, **options):
        recipient_email = options['email']
        subject = "Test Email from KazuPay Solutions"
        html_content = """
        <html>
            <body>
                <h1>This is a test email.</h1>
                <p>If you are seeing this, your Brevo email integration is working correctly.</p>
            </body>
        </html>
        """
        
        self.stdout.write(f"Attempting to send a test email to {recipient_email}...")
        
        try:
            send_email(subject, html_content, recipient_email)
            self.stdout.write(self.style.SUCCESS(f"Successfully sent email to {recipient_email}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to send email: {e}"))

