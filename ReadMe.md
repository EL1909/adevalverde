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

## LIVE FROM ESFUERZO VM

    1. Create requirements.txt and commit
    
        $ pip freeze > requirements.txt
    
    2. Create folder within Goocle Cloud VM 
    
        $ esfuerzo-host1/projects mkdir adelavalverde


    3. Fecth project from github using token (esfuerzo)
        $ git clone git@github.com:el1909/adevalverde.git

    
    4. Create Gunicorn configuration for each project
        3.1 - Activate individual virtual enviroments for this project
               
                $ source /home/efrain19091/projects/adelavalverde/adevalverde/ade_env/bin/activate

        3.2 - Install gunicorn

                $ pip install gunicorn

        3.3 - Start screen to run the site using gunicorn

                $ screen -S [name of project] (start a new session)

                $ control key + A + D (detacht)

                $ screen -R [name of project] (close running session)

        3.4 - Bind project's wsgi file to a port
                
                $ gunicorn --bind 127.0.0.1:8081 jhgeruetsbau.wsgi:application

    4. Remove parked DNS
        4.1 - Ensure DNS leads to VM IP, and remove parked domain setting
    

    5. Install and configure Nginx to VM in order to manage multiple hosting
        5.1 - Include domain in nginx file within sites available

                $ sudo nano /etc/nginx/sites-available/hundegger
        
        5.2 - Create file with location for gunicorn process, static, media and .well-known paths

    6. Install SSL Certificate
        6.1 - Install certbot
            
            $ sudo install certbot
        
        6.2 - Create LetsEncrypt folder path

            $ sudo mkdir /var/www/letsencrypt/.well-known/acme-challenge/
        
        6.3 - Create SLL certificate using Certbot

            $ sudo certbot --nginx -d geruestbau-hundegger.de -d www.geruestbau-hundegger.de


## 27.01.24

Bring it Online

1. Environment Configuration:

Ensure your =production environment= meets the requirements for running Django. 

This includes having Python installed, along with any necessary dependencies specified in your requirements.txt file.

Set up a virtual environment for your project to isolate its dependencies from other projects and the system-wide Python installation.

    1.1 Server Provider Selection
Select a Server Provider: Choose a server provider based on factors such as pricing, features, scalability, geographic location, and ease of use. Each provider offers different services and configurations, so you'll want to research and compare them to find the best fit for your requirements.

    1.1.1 Google Cloud Platform Account created

1.2 Set Up a Server Instance/ Set Up a Virtual Machine Instance:
In the Cloud Console, navigate to the Compute Engine section and click on "VM instances". Click the "Create" button to create a new virtual machine instance.

Configure the instance settings, including the machine type, boot disk (select a Linux distribution like Ubuntu), and any additional options you need. You can also set up SSH access to the instance.

Once you've configured the instance settings, click the "Create" button to provision the virtual machine.


    PRICES ARE TOO HIGH, DECIDED TO KEEP WITH HEROKU AND LOOK FOR A BETTER LONG TERM SOLUTION
        Can not install Heroku via Brew, lacking of space in my current computer


1.3 Deploy Your Django Project: After setting up the server instance, you'll upload your Django project files to the server. This typically involves using tools like Git for version control and SSH for secure file transfer.

    1.3.1 - STATIC FILES will be handled by whitenoise, installed to the project via VS.Code Terminal

    1.3.2 - MEDIA FILES will be handled with Google Cloud Storage due to small amount of data (so far)
        Google Cloud Storage incurr high costs; 
    1.3.3 - MEDIA FILES will be handled by Cloudinary
        - CLOUDINARY SETUP -
        - Sign Up for Cloudinary:
        - Install Cloudinary Python SDK: $ pip install cloudinary
        - Configure Cloudinary in Django project's settings.py file, add the following configuration settings for Cloudinary:

            # settings.py

            import cloudinary
            import cloudinary.uploader
            import cloudinary.api

            # Cloudinary configuration
            cloudinary.config(
                cloud_name='your_cloud_name',
                api_key='your_api_key',
                api_secret='your_api_secret'
            )
                
        - Media Uploads using the Cloudinary Python SDK's upload() method. 
        In this case as i have no upload mage functionallity so far, i only uploaded the BGimages.

        - Integrate Cloudinary URLs in Templates, In this case i have modified the context processor within home to fetch the images from ccloudinary.

        - Handle Media Deletion (Optional).

1.4 Install PostgreSQL:

        1.4.1 - Add PostgreSQL Add-On: Provision a PostgreSQL database add-on for your Heroku app by running:
                - I did not because costs did applied, instead created a free instance in ElephantSQL:
        1.4.2 - Configure Django to Use ElephantSQL Database Locally:
                - Install Required Packages: $ pip install psycopg2-binary
                - Update Django Settings:

                        # settings.py

                        DATABASES = {
                            'default': {
                                'ENGINE': 'django.db.backends.postgresql',
                                'NAME': 'your_database_name',
                                'USER': 'your_database_username',
                                'PASSWORD': 'your_database_password',
                                'HOST': 'your_database_host',
                                'PORT': 'your_database_port',
                            }
                        }

                - Apply Migrations: $ python3 manage.py makemigrations
                                    $ python3 manage.py migrate

                - Test Connection:
                    Database models are created but new database for users need to be prompted.   


1.5 Prepare Django Project for Deployment to Heroku:
    - Install gunicorn: $ pip install gunicorn
                        $ pip freeze > requirements.txt

    - Configure Static and Media Files: -DONE-
    - Deploy Django Project to Heroku:
    - Set Up Environment Variables:
        - DATABASE_URL
        - DEBUG
        - DISABLE_COLLECTSTATIC
        - SECRET_KEY
        - CLOUDINARY_URL
        - PORT 
    
        - EMAIL_BACKEND
        - STATIC_ROOT
        - MEDIA_ROOT
        - ALLOWED_HOSTS

    - Commit your changes to your Git repository.
    - Deploy Your Application to Heroku:



2. Database Setup:
Choose a production-ready database like PostgreSQL, MySQL, or SQLite (not recommended for production).
Update your Django project settings (settings.py) to use the appropriate database settings for your production database.


3. Static and Media Files Handling:
Configure your web server (like Nginx or Apache) to serve static and media files efficiently.
Review Django's static files documentation to ensure you understand how to manage static files in production.

4. Security:
Review Django's security documentation and ensure your project follows best practices, including setting proper security settings, handling user authentication securely, and protecting against common web vulnerabilities like CSRF, XSS, and SQL injection.
Consider using HTTPS to encrypt data transmitted between the client and server.

5. Deployment Strategy:
Choose a deployment strategy that suits your needs, such as using a Platform-as-a-Service (PaaS) provider like Heroku, a dedicated server, or a cloud hosting provider like AWS, Google Cloud, or DigitalOcean.
Familiarize yourself with deployment tools like Fabric, Ansible, or Docker for automating deployment tasks.

6. Web Server Configuration:
Set up and configure a web server (such as Nginx or Apache) to serve your Django application.
Configure the web server to proxy requests to your Django application running on a WSGI server like Gunicorn or uWSGI.

7. Domain Name and DNS Configuration:
Register a domain name for your project if you haven't already done so.
Configure DNS settings to point your domain name to your server's IP address.

8. Monitoring and Logging:
Set up monitoring and logging solutions to track the health and performance of your Django application in production.
Configure logging to capture relevant information for debugging and monitoring purposes.

9. Backup and Disaster Recovery:
Implement backup strategies to regularly back up your database and any other critical data.
Have a disaster recovery plan in place to handle unforeseen issues or outages.

10. Testing:
Before deploying to production, thoroughly test your application in a staging environment to catch any potential issues or bugs.
Consider using automated testing frameworks like Django's built-in testing tools or pytest to automate testing procedures.

11. Scaling:
Consider scalability requirements and plan for future growth by designing your application to scale horizontally or vertically as needed.

12. Documentation:
Document your deployment process, including any custom configurations or setup steps, to make it easier to maintain and troubleshoot your application in the future.
By reviewing and addressing these aspects, you'll be better prepared to take your Django project online and ensure its successful deployment in a production environment.