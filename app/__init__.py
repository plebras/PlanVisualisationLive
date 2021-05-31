from flask import Flask
import os

frontend_dir = os.path.abspath('app/frontend/app')

app = Flask(__name__, template_folder=frontend_dir, static_folder=frontend_dir)

from app import routes

# from app import planparser