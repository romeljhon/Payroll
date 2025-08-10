from dotenv import load_dotenv
from mailersend import MailerSendClient

# Load .env from project root
load_dotenv()

# Initialize the client using MAILERSEND_API_KEY from .env or system env
ms = MailerSendClient()
