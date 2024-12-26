![Avalverde](include image path)
<center><a href="include domain" target="_blank">Click here to visit the site</a> - <a href="https://github.com/EL1909/adevalverde" target="_blank">Click here to visit repository</a></center>

Currently:
    - Users can Register and Login 
    - Admin is able to update items in the store
    - Products are linked to Amaon Store for inmediate purchase



# Table of Contents - v1

- [Introduction](#Adela-Valverde)
- [Working Methodology](#working-methodology)
- [User Stories](#user-stories)
- [Moscow Prioritization](#moscow-prioritization)
- [Database Design](#database-design)
    - [Models](#models)
    - [Database Relationships](#database-relationships)
- [Users Types](#users-types)
- [CRUD Operations](#crud-operations)
- [Features](#features)
    - [Design and Colors](#design-and-colors)
    - [Navigation](#navigation)
- [Testing](#manual-testing)
- [Project Creation Process](#project-creation-process)
- [Deployment to Heroku](#deploy-to-heroku)
- [Bugs](#bugs)
    - [Unfixed](#unfixed)
    - [Fixed](#fixed)
- [Features to Improve](#features-to-improve)
- [Credits](#credits)


<br>


# [Introduction](#Adela-Valverde)

This is a personal website for Adela Valverde.

It's intended to handle her online activities, marketplace, blog multimedia, events -done and to do- registration and user accounts.

Users of the website are able to be updated on Adela Valverde's most recent publications, They will be also able to find previous books and other content created by Adela, keep messages and request private meetings.

Those that are not familiarized with her background will have access to review Adela's working and personal history, as well as those whom have make part of her pathway.


# [Working Methodology](#working-methodology)

In order to achieve this release, i determined tasks having in mind an Agile mindset and stablishing goals to be completed within weekly iterations.

Placing myself in the user's position, and anticipating the user's wants and needs, i made myself the following questions:

- Why would a user want to visit our blog? 
- What will make them return?
- What do i want to see when I visit a blog What would make me return

From those answers I did set up 5 issues in GitHub as User Stories.

## [Technical Enviroment]

Step 1. Open VSCode and Create the Project

Step 2. Setup Virtual Enviroment

	2.1 Whithin a desired directory, Create a virtual environment:
	    $ python3 -m venv myenv
	Replace myenv with your preferred name.
	
	2.2 Activate the virtual environment:	
	    $ source myenv/bin/activate

Step 3. Install Django & Python

    3.1 Ensure Python is installed: Open Terminal and check by running:
        $ python3 --version
    If not installed, download and install Python from the official website.

    3.2 Install Django:
        $ pip3 install django
    3.3 Create the Django project in VSCode's integrated terminal:$ django-admin startproject myprojectnameReplace myprojectname with your project name.

Step 4. Define Apps and models

Step 5. Configure Templates path within settings.py 
        TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [BASE_DIR / 'templates'],  # Add this line
            'APP_DIRS': True,
            ...
        },
    ]

Step 6. Configure .env file
    - Install Decouple
        $ pip install python-decouple
    - Add it to settings.py/installed apps
    - Import and setup key using links to .env file 
        settings.py:
        SECRET_KEY = config('SECRET_KEY')
        .env:
        SECRET_KEY=whatevervaluewithoutspacesorquotes

Step 7. Install Users App
    - using user auth model from django, created bsig register and login/out views

Step 8. Install Store app
    - As the main goal of the website owner is to go live with products  presentation, we will install the Store app, having models such as Products, Inventory, Provider, Order and orderItem
    - Create Models
    - Create Templates




### [User Stories](#user-stories)

    - As a Visitor I can Create an account so that i can have a user or superuser profile.

    - As a Visitor I can See all products and services provides by Adela so that i can purchase or acquire those services.

    - As a Visitor I can Watch one main item on the home page so that I can easily access without surfing the site.

    - As a Visitor I can review Adela's background so that i'm aware of her biography and other informations she wants to share.

    - As a User I can log in and out to Access user features.



## [Database Design](#database-design)

### [Models](#models)
For the first version of thi project, I will be using four different database models for this project:

User, Store, KeyMoments and Categories.

1. The User class is the default User class from Django.
    - User class will reside within user App, in order to manage templates and view for different user types.

    - Superuser is created in default DataBase under:
    user: admin
    pass: 12345

    Create templates and views to manage accounts




2. The Key Moments model is a key custom class in this project as the main function of the site is for users to travel thru Adela Valverde life's timeline.

class key_moments(models.Model):

    title = models.CharField(max_length=128)
    user = models.ForeignKey()
    excerpt = models.CharField()
    status = models.IntegerField()
    description = models.TextField()
    image = models.ImageField()
    cropped_image = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField()
    likes = models.ManyToManyField()    
    moment_type = models.CharField()

3. The Products model is a class for creating product items within different categories.

class Product(models.Model):

    category = models.ForeignKey()
    sku = models.CharField()
    name = models.CharField()
    description = models.TextField()
    price = models.DecimalField()
    rating = models.DecimalField()
    image_url = models.URLField()
    image = models.ImageField()
    created_by = models.ForeignKey()

4. The Category model is a class to determine categories for the products or services published on the website.

class Category(models.Model):

    name = models.CharField()
    friendly_name = models.CharField()


### [Database Relationships](#database-relationships)

## Store APP:
Database Model Relationships
Category:
A Category can have many Products.
Relationship: Product has a ForeignKey to Category.

Provider:
A Provider can supply many Products, and a Product can be associated with multiple Providers.
Relationship: Product has a ManyToManyField to Provider.

Product:
A Product can belong to one Category.
Relationship: Category to Product via ForeignKey.
A Product can be associated with multiple Providers.
Relationship: ManyToManyField with Provider.
A Product can be in multiple OrderItems but does not directly reference Order.
Relationship: Product to OrderItem via ForeignKey.

Order:
An Order belongs to one User.
Relationship: ForeignKey from Order to User.
An Order contains multiple OrderItems.
Relationship: OrderItem has a ForeignKey to Order.

OrderItem:
An OrderItem is part of one Order and references one Product.
Relationship: ForeignKey to Order and Product.

Visual Representation:
User (get_user_model())
  |
  |-- Order
  |    |
  |    |-- OrderItem
  |         |
  |         |-- Product
  |              |
  |              |-- Category (one-to-many)
  |              |
  |              |-- Provider (many-to-many)
  |
  |-- Product (via created_by)

Category
  |
  |-- Product (one-to-many)

Provider
  |
  |-- Product (many-to-many)

Notes:
Order calculates its totalAmount based on OrderItems using get_total_price() and updates this on save.
Product's image path is dynamically generated to avoid filename conflicts.
OrderItem's price is stored at the time of order creation to keep historical pricing data, even if the product's price changes later.

This diagram shows how each model relates to others, highlighting the foreign key and many-to-many relationships. Remember to adjust the naming according to your project's conventions if different from what's shown here.

## [Users Types](#users-types)

There's three type of expected users.

### Visitors:

- Will be able to watch all publications and online store.
- Will be able to register as a member using a valid email.

### Members

- Will be able to register payment information to access store items or services.
- Will be able to comment on key moments posts.

### Superusers

- Will be able to manage products and services.
- Will be able to manage key moments.


# Deployment

Desired domain:
www.adelavalverde.com -NOT AVAILABLE-

www.adelavalverde.info

## LIVE FROM ESFUERZO VM

    1. Create requirements.txt and commit

        $ pip freeze > requirements.txt
    
    2. Create folder within Goocle Cloud VM 
    
        $ esfuerzo-host1/projects mkdir adelavalverde

    3. Fecth project from github using token (esfuerzo)
        $ git clone git@github.com:el1909/adevalverde.git
    
    4. Create .env file within VM

        $ touch .env
        $ nano .env
            copy variables saved in .env project file
            control + X

    5. Create Gunicorn configuration for each project
        5.1 - Install gunicorn

                $ pip install gunicorn
         
        5.2 - Terminate venv session

                $ deactivate

        5.3 - Start screen to run the site using gunicorn

                $ screen -S [name of project] (start a new session)

                $ control key + A + D (detacht)

                $ screen -R [name of project] (close running session)

        5.4 - Activate individual virtual enviroments for this project
               
                $ source projects/adelavalverde/adevalverde/ade_env/bin/activate

        5.5 - Bind project's wsgi file to a port
                
                $ gunicorn --bind 127.0.0.1:8080 adevalverde.wsgi:application

    6. Create NginX config file
        6.1 Navigate to nginx site-availables folder
        
            $ ./etc/nginx/sites-available
        
        6.2 Create new nginx config file for this project, within:
         
            6.2.1 - Go to folder:
                $ ../etc/nginx/sites-avaiable

            6.2.2 - Create File:
            $ sudo nano adevalverde

            server {
                listen 80; # All sites must listen to 80, nginx redirects them internally
                server_name adelavalverde.info www.adelavalverde.info;  # Replace with registered domain

                location / {
                    proxy_pass http://127.0.0.1:8082;  # Port where Gunicorn is running, must point to 127.0.0.1:(desired port) for security reasons
                    proxy_set_header Host $host;
                    proxy_set_header X-Real-IP $remote_addr;
                    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                    proxy_set_header X-Forwarded-Proto $scheme;
                }

                location /static/ {
                    alias /home/efrain19091/projects/adelavalverde adevalverde/static/;  # Path to your static files
                }

                location /media/ {
                    alias /home/efrain19091/projects/adelavalverde adevalverde/media/;  # Path to your media files
                }
            }

            ATTENTION: 
            - listen 80; # All sites must listen to 80, nginx redirects them internally
            - Port where Gunicorn is running, must point to 127.0.0.1:(desired port) for security reasons
            - Setup static and media paths
    
        6.3 - Create link to file within site-enabled folder

            $ sudo ln -s /etc/nginx/sites-available/adevalverde /etc/nginx/sites-enabled/

    7. Create a SSL certificate using Certbot.

        7.1 -  Upgrade all Packages 

            $ sudo apt upgrade

        7.2 - Ensure domain resolves properly

            $ dig adelavalverde.info

        7.3 - Run Certbot to Obtain and Install the SSL Certificate

            $ sudo certbot --nginx -d adelavalverde.info -d www.adelavalverde.info

            Certbot will add ssl_certificate to nginx config file automatically
        
        7.4 - Test the SSL Configuration and setup auto-renewal

            After Certbot finishes, you can test your SSL setup by visiting your site via https://adelavalverde.info or https://www.adelavalverde.info.

            Certbot automatically sets up a cron job to renew all certificates every 60 days. Test the renewal process by running:

            $ sudo certbot renew --dry-run

            This ensures that Certbot will renew your certificates without issues when the time comes.

