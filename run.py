import webbrowser
from threading import Timer
from app import app
import argparse

domain = '127.0.0.1'

# Setting up arguments
a_parser = argparse.ArgumentParser()
# positional arguments
# a_parser.add_argument('input', help='Input file name')
# a_parser.add_argument('output', help='Output file name')
# other arguments
# a_parser.add_argument('-l','--log', help='Log file name', default='log.txt')
a_parser.add_argument('-p', '--port', help='Port number', default='2000')
a_parser.add_argument('-d','--debug', help='Debug mode', action='store_true')
args = a_parser.parse_args()

# function to open frontend app in browser
def launch_browser():
    webbrowser.open_new('http://%s:%s'%(domain,args.port))

# main
if __name__ == '__main__':
    Timer(1, launch_browser).start()
    app.run(domain, args.port, debug=args.debug)