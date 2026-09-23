from flask import Flask, redirect

app = Flask(__name__)

NEW_DOMAIN = 'https://dqt-damage.com'

@app.route('/')
def index():
    return redirect(NEW_DOMAIN + '/', code=301)

@app.route('/simple')
def simple():
    return redirect(NEW_DOMAIN + '/simple', code=301)

@app.route('/other')
def other_page():
    return redirect(NEW_DOMAIN + '/other', code=301)

@app.route('/ver')
def show_version():
    return redirect(NEW_DOMAIN + '/ver', code=301)

@app.route('/privacy')
def privacy():
    return redirect(NEW_DOMAIN + '/privacy', code=301)

@app.route('/calculate', methods=['POST'])
def calculate():
    return redirect(NEW_DOMAIN + '/calculate', code=307)

if __name__ == '__main__':
    app.run(debug=True)
