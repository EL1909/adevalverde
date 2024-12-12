![Avalverde](include image path)
<center><a href="include domain" target="_blank">Click here to visit the site</a> - <a href="https://github.com/EL1909/adevalverde" target="_blank">Click here to visit repository</a></center>


## Table of Contents - v1

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


## [Introduction](#Adela-Valverde)

This is a personal website for Adela Valverde.

It's intended to handle her online activities, marketplace, blog multimedia, events -done and to do- registration and user accounts.

Users of the website are able to be updated on Adela Valverde's most recent publications, They will be also able to find previous books and other content created by Adela, keep messages and request private meetings.

Those that are not familiarized with her background will have access to review Adela's working and personal history, as well as those whom have make part of her pathway.


## [Working Methodology](#working-methodology)

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

Step 5. Configure .env file
    - Install Decouple
        $ pip install decouple
    - Add it to settings.py/installed apps
    - Import and setup key using links to .env file 
        settings.py:
        SECRET_KEY = config('SECRET_KEY')
        .env:
        SECRET_KEY=whatevervaluewithoutspacesorquotes

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
    user: Admin
    pass: 12345




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

to be determined

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






