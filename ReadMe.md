![Avalverde](include image path)
<center><a href="www.adelavalverde.info" target="_blank">Click here to visit the site</a> - <a href="https://github.com/EL1909/adevalverde" target="_blank">Click here to visit repository</a></center>

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
    4.1 - Create App
        $ python3 manage.py startapp [app-name]
    4.2 - Add it to the apps list in settings.py
    4.3 - Include in main urls.py
    4.4 - Configure Models, templates and views


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
        SECRET_KEY=whatevervaluewithoutspacesnorquotes

Step 7. Install Users App
    - Using user auth model from django, created register and login/out views

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



# [Database Design](#database-design)

## [Models](#models)
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


## [Database Relationships](#database-relationships)
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






# Apps

## Users App:
The User class is the default User class from Django.



## Store App:

## KeyMoments App:

The Key Moments model is a key custom class in this project as the main function of the site is for users to travel thru Adela Valverde life's timeline.

### Models:
    - class KeyMoment:

### Views:
    - key_moments_list
    - create_key_moment
    - edit_key_moment
    - delete_key_moment

### Forms:
    - KeyMomentsForm

### Templates:
    - keymoments.html
    - modal.html

### CSS & JS
Include js and css at the bottom of base.html
    <!-- KeyMoments -->
    <link rel="stylesheet" href="{% static 'css/key_moments.css' %}" type="text/css">
    <script src="{% static 'js/key_moments.js' %}"></script>



## Canal App.

Within this app i'll be looking foreward to post a set of recurrent videos of different approved_users.

On canal main page user can see a list of programs.

Within a program, user can see:
    - brief description of this program
    - release dates for new episodes
    - Each program must have an expected release period
    - User can propose topics to be talked in next episodes
    - User can like/dislike, react (add icon) to episodes


### Models:
Program class manage different content to be hosted within "The Channel".
    - class Program(models.Model):

Episode class manage different content to be hosted within Program.    
    - class Episode(models.Model):

RequestedTopic class manage content requests.
    -class RequestedTopic(models.Model):

Reactions class handles user interaction with a particular content; THIS MODEL CAN BE IMPORTED TO OTHER 
    - class Reactions(models.Model):


### Views


Canal App Views: AddProgram(View): AddEpisode(View):
Canal App Templates:
add_episode.html canal.html new_program.html
Remesas App Forms: ProgramForm. EpisodeForm.
04.04.24
I will pause the CANAL app to go back to remesas, currently the canal tab can add a program, and display list of programs and episodes add episode functonallity is not working properly, it creates episodes as new programs.

- Integrate with YouTube API: Use the YouTube Data API to interact with your YouTube channel.
- Authenticate your Django app with the API using OAuth.
- Fetch information about your videos, playlists, etc., and display them on your website.
- Implement Search Functionality: If needed, add search functionality to allow users to find specific programs or episodes easily.
- Ensure Security: Secure your Django project by following best practices such as using HTTPS, validating user inputs, and protecting against common vulnerabilities like SQL injection and cross-site scripting (XSS).
- Permitir notas de voz en comentarios
- Desbloquear videos con likes acumulados, ej. 100likes = 10 creditos, 1 credito = 1 view.


# [Users Types](#users-types)

There's three type of expected users.

## Visitors:

- Will be able to watch all publications and online store.
- Will be able to register as a member using a valid email.

## Members

- Will be able to register payment information to access store items or services.
- Will be able to comment on key moments posts.

## Superusers

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


#

Madre bendición

ya puedes entrar en la pagina e ir viendo, 

Para empezar con la venta del libro, dime que es lo que voy a ir haciendo con:

1. Que va a salir en en home
2. Que poner/quitar en general

Por el tipo de pagina (pagina de persona/influencer) todavia tengo ue vover a instalar:

1. Generador de biografia
2. 










{% extends "base.html" %}
{% block content %}
<div class="mundo">
    <div class="svg-container col-12">
        <div class="svg" id="svg-content">
            {% for svg in svgPaths %}
            <div class="svg-item" id="svg-{{ loop.index }}">
                {% include svg %}
            </div>
            {% endfor %}
        </div>
    </div>
</div>
{% endblock %}


X-X   client requests   X-X



home page: Presenta el ultimo producto desarrolaldo por Adela

Retos de Oro

	1.	Estructura General:
	•	El HTML está organizado en secciones claras: encabezado, descripción general, características, contenido, beneficios y pie de página.

	•	Se utilizaron elementos de sección y div para estructurar las partes del contenido.

	2.	Estilo:
	•	La página utiliza un estilo simple y limpio, haciendo contraste entre tonos claros y tonos oscuros para asegurar que la información sea fácil de leer.

	•	El color principal es el amarillo dorado (#f5c400), simbolizando el “oro” y el propósito positivo del libro. Puedes cambiar el color si lo deseas.

	•	Los botones de llamada a la acción (cta-button) son de un color destacado para atraer la atención y motivar al usuario a hacer clic.

	3.	Responsividad:
	•	El diseño es completamente responsive, lo que significa que se ajustará bien a dispositivos móviles y de escritorio.

	4.	Secciones Clave:
	•	Encabezado (Header): Incluye el título principal y un botón de llamada a la acción que lleva al usuario a la sección de compra.

	•	¿Por qué elegir este libro? (Features): Tres características clave del libro con iconos descriptivos.
	•	Contenido del Libro: Expone lo que el lector puede esperar encontrar en el libro.
	•	Beneficios: Resalta los beneficios principales del libro para la vida personal del lector.
	•	Botones CTA: Asegúrate de que los botones tengan enlaces que dirijan a la página de compra.

	5.	Acción Requerida:
	•	El programador puede agregar el enlace de compra en los botones que están definidos con #order, para que el usuario sea dirigido a la página de compra del libro.









    Para hacer la landing page aún más inspiradora e irresistible, podemos agregar algunos elementos que refuercen el impacto emocional, la confianza del cliente y la urgencia para tomar acción. Aquí te dejo algunas ideas adicionales:

1. Testimonios de Lectores o Usuarios:

Incluir testimonios o reseñas de personas que hayan tenido experiencias positivas con el libro (si ya has recibido alguna retroalimentación) es clave para generar confianza. Los testimonios deben ser breves pero poderosos, mencionando cómo el libro les ha ayudado a transformar su vida.

Ejemplo de Testimonio:

<section class="section" style="background-color: #f1f1f1;">
    <h2>🌟 Lo que dicen nuestros lectores</h2>
    <div class="testimonials">
        <blockquote>
            <p>"Retos de Oro 2025 me ayudó a comenzar el nuevo año con una mentalidad de gratitud y propósito. Cada página me ha inspirado a crecer y seguir mis sueños. ¡Definitivamente lo recomiendo!"</p>
            <cite>- María Gómez, Lectora Entusiasta</cite>
        </blockquote>
        <blockquote>
            <p>"Este libro ha sido una herramienta transformadora. Las actividades y reflexiones me permitieron enfocarme en lo que realmente importa en mi vida. ¡Gracias por este regalo!"</p>
            <cite>- Juan Pérez, Usuario Satisfecho</cite>
        </blockquote>
    </div>
</section>

2. Oferta Limitada o Descuento Especial:

Agregar una oferta limitada o descuento exclusivo puede crear urgencia en los visitantes para que tomen acción rápidamente.

Ejemplo de Oferta Limitada:

<section class="section" style="background-color: #ff6600; color: white;">
    <h2>🎁 ¡Oferta Exclusiva! 🎁</h2>
    <p>¡Compra ahora *Retos de Oro 2025* y obtén un **descuento especial del 15%**! Solo por tiempo limitado.</p>
    <a href="#order" class="cta-button">¡Aprovecha la oferta ahora!</a>
</section>

3. Contador de Tiempo (Urgencia):

Un contador regresivo que indique el tiempo restante para aprovechar una oferta o descuento puede aumentar la urgencia para tomar acción.

Ejemplo de Contador de Tiempo:

<section class="section">
    <h2>⏰ ¡El tiempo está corriendo! ⏰</h2>
    <p>¡No pierdas esta oportunidad! Solo tienes hasta <strong>12 de enero de 2025</strong> para obtener tu copia con descuento.</p>
    <div id="countdown"></div>
    <a href="#order" class="cta-button">¡Haz tu pedido ahora!</a>
</section>

<script>
    var countdownDate = new Date("Jan 12, 2025 00:00:00").getTime();
    var countdownFunction = setInterval(function() {
        var now = new Date().getTime();
        var distance = countdownDate - now;
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        document.getElementById("countdown").innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s";
        if (distance < 0) {
            clearInterval(countdownFunction);
            document.getElementById("countdown").innerHTML = "¡La oferta ha terminado!";
        }
    }, 1000);
</script>

4. Imágenes Inspiradoras:

Las imágenes tienen un gran poder emocional. Asegúrate de incluir imágenes de alta calidad que transmitan paz, gratitud, bienestar y propósito. Imágenes de personas disfrutando de la lectura, reflexionando, o haciendo las actividades del libro pueden inspirar a los visitantes a imaginarse a sí mismos participando.

Puedes incluir una galería de imágenes:

<section class="section">
    <h2>🌟 Imágenes de Inspiración 🌟</h2>
    <div class="gallery">
        <img src="imagen1.jpg" alt="Imagen inspiradora 1">
        <img src="imagen2.jpg" alt="Imagen inspiradora 2">
        <img src="imagen3.jpg" alt="Imagen inspiradora 3">
    </div>
</section>

5. Botón Flotante para Compra Rápida:

Un botón de compra flotante que siempre esté visible al desplazarse por la página puede facilitar la compra en cualquier momento.

Ejemplo de botón flotante:

<a href="#order" class="cta-button" style="position: fixed; bottom: 20px; right: 20px;">¡Compra ahora!</a>

6. Beneficios de Bienestar Personal y Crecimiento:

Profundiza un poco más en los beneficios específicos que las personas experimentarán al realizar las actividades del libro. Enfócate en cómo el libro les ayudará a mejorar su salud mental, emocional y espiritual.

Ejemplo:

<section class="section" style="background-color: #f1f1f1;">
    <h2>🌱 Beneficios para tu bienestar personal</h2>
    <ul>
        <li><strong>Reducción del estrés:</strong> Las actividades interactivas y reflexiones te ayudarán a desconectar y a encontrar momentos de paz interior.</li>
        <li><strong>Mayor enfoque:</strong> Establecerás metas claras y aprenderás a priorizar lo que realmente importa en tu vida.</li>
        <li><strong>Crecimiento espiritual:</strong> Las afirmaciones y los temas profundos fomentan una conexión más cercana con tu propósito divino y tu bienestar interior.</li>
    </ul>
</section>

7. Garantía de Satisfacción:

Ofrecer una garantía de devolución de dinero puede darles a los compradores potenciales la confianza de que pueden probar el libro sin riesgo.

Ejemplo de Garantía:

<section class="section" style="background-color: #e0f7fa;">
    <h2>✔️ ¡Garantía de Satisfacción 100%!</h2>
    <p>Si no estás completamente satisfecho con tu compra, ofrecemos una garantía de devolución de dinero en 30 días. ¡Compra sin preocupaciones!</p>
</section>

8. Enlace de Compra Directa (Sin Necesidad de Desplazarse):

Además de tener el botón de llamada a la acción en diferentes puntos de la página, puedes agregar un enlace directo al inicio y al final de la página para que el usuario pueda comprar sin desplazarse por toda la página.

Resumen de Ajustes Clave:
	1.	Testimonios que validen la efectividad del libro.
	2.	Oferta limitada o descuento exclusivo.
	3.	Contador regresivo para crear urgencia.
	4.	Imágenes inspiradoras para emocionalizar la experiencia.
	5.	Botón flotante para compra rápida.
	6.	Enlace directo de compra sin desplazarse.
	7.	Garantía de satisfacción para aumentar la confianza.
	8.	Detalles de bienestar personal como beneficios clave.

Con estos elementos adicionales, la página de ventas no solo atraerá a más clientes, sino que también creará un deseo irresistible de adquirir el libro y empezar a transformar sus vidas.







necesitarás realizar algunos ajustes y tener en cuenta algunos puntos antes de pasárselo a tu programador:

Pasos a seguir para trabajar con tu programador:
	1.	Diseño Visual y Estilo:
	•	El HTML que te proporcioné no incluye el estilo visual (CSS). Tu programador deberá crear los estilos adecuados para que el contenido luzca bien en la web. Los colores, fuentes, espaciado, botones y el diseño en general deberán alinearse con la identidad visual de tu marca y la experiencia de usuario que deseas ofrecer.
	2.	Optimización para Móviles (Responsividad):
	•	Asegúrate de que la landing page sea responsive (adaptable a dispositivos móviles). Esto es crucial porque muchas personas navegarán desde sus teléfonos o tabletas. Tu programador deberá implementar media queries en el CSS para asegurar que la página se vea bien en todos los tamaños de pantalla.
	3.	Funciones Interactivas:
	•	El contador de tiempo y otros elementos interactivos, como los botones flotantes, necesitarán JavaScript para funcionar correctamente. Asegúrate de que tu programador implemente esos scripts correctamente para que la funcionalidad de la página sea óptima.
	4.	Integración con tu sistema de ventas:
	•	El botón de compra y el formulario de adquisición (o un enlace de pago directo) necesitarán ser integrados con tu sistema de ventas o pasarela de pago (por ejemplo, PayPal, Stripe, o el sistema que estés utilizando). Esto puede implicar la creación de un formulario de compra o un enlace que lleve al usuario a un proceso de pago seguro.
	5.	SEO y Optimización:
	•	Asegúrate de que la página esté optimizada para SEO. Esto incluye el uso de metadatos adecuados, como etiquetas <title>, <meta description>, y palabras clave en los textos. Esto ayudará a que la página sea encontrada por los motores de búsqueda.
	6.	Pruebas y Ajustes:
	•	Una vez que tu programador haya implementado la landing page, es crucial probar todos los elementos (enlaces, botones, formularios, etc.) y asegurarse de que todo funcione correctamente, especialmente en diferentes navegadores y dispositivos.

Qué puedes hacer ahora:
	1.	Enviar al programador el contenido HTML básico que te proporcioné como base. Explícale que eso es solo un esqueleto de la landing page y que necesita personalización para que se vea bien y funcione correctamente.
	2.	Trabajar con él en la parte visual, asegurándote de que se ajuste a la imagen de tu marca.
	3.	Definir las funcionalidades adicionales como el contador de tiempo, los formularios de pago y la integración con el sistema de ventas.

Lo que podrías enviar a tu programador:
	•	El HTML básico de la landing page.
	•	El contenido visual que deseas usar (imágenes, logotipo, colores, etc.).
	•	La funcionalidad deseada (por ejemplo, integración con el pago, contador de tiempo, botones flotantes).
	•	Especificaciones sobre optimización móvil y responsividad.
	•	Detalles de los testimonios y demás contenido adicional (si ya los tienes).

De esta manera, tu programador podrá desarrollar la landing page de manera profesional, asegurando que todo funcione como esperas y con el diseño adecuado.


Imagen de fondo o ilustraciones secundarias:
	•	Tamaño recomendado: 1920px de ancho x 1080px de alto.












<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Retos de Oro 2025</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f9;
            color: #333;
        }

        

        h1 {
            font-size: 36px;
            margin-bottom: 20px;
        }

        .cta-button {
            background-color: #ff6600;
            color: white;
            padding: 15px 30px;
            font-size: 18px;
            border: none;
            cursor: pointer;
            margin-top: 20px;
            text-decoration: none;
            display: inline-block;
        }

        .cta-button:hover {
            background-color: #ff4500;
        }

        .section {
            padding: 50px 20px;
            text-align: center;
        }

        .section h2 {
            font-size: 28px;
            margin-bottom: 20px;
        }

        .section p {
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 30px;
        }

        .features {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
        }

        .feature {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            max-width: 300px;
            text-align: center;
        }

        .feature h3 {
            font-size: 24px;
            margin-bottom: 10px;
        }

        .feature p {
            font-size: 16px;
            margin-bottom: 10px;
        }

        footer {
            background-color: #222;
            color: white;
            text-align: center;
            padding: 20px;
            position: relative;
            bottom: 0;
            width: 100%;
        }
    </style>
</head>
<body>

    <!-- Header Section -->
    <header>
        <h1>✨ Bienvenido a Retos de Oro 2025: Gratitud, Propósito y Vida Plena ✨</h1>
        <a href="#order" class="cta-button">¡Comienza tu viaje ahora!</a>
    </header>

    <!-- Descripción General -->
    <section class="section">
        <h2>Retos de Oro 2025: Tu herramienta para transformar tu vida</h2>
        <p>Retos de Oro 2025 no es solo un libro: es una herramienta poderosa para transformar tu vida. Diseñado especialmente para cerrar el 2024 con gratitud y comenzar el 2025 con propósito, este libro combina actividades interactivas, reflexiones inspiradoras y un enfoque lúdico para ayudarte a crear una vida plena y consciente.</p>
    </section>

    <!-- ¿Por qué elegir Retos de Oro 2025? -->
    <section class="section">
        <h2>🎉 ¿Por qué elegir Retos de Oro 2025?</h2>
        <div class="features">
            <div class="feature">
                <h3>🧩 Actividades significativas</h3>
                <p>Con 36 sopas de letras y reflexiones basadas en temas esenciales como gratitud, propósito, abundancia espiritual, prosperidad financiera y relaciones positivas, este libro es un compañero perfecto para fortalecer tu crecimiento personal.</p>
            </div>
            <div class="feature">
                <h3>💡 Reflexiones transformadoras</h3>
                <p>Cada actividad incluye afirmaciones y mensajes que te guiarán en tu camino hacia la autoexploración y el logro de tus metas.</p>
            </div>
            <div class="feature">
                <h3>📖 Diseño cómodo y accesible</h3>
                <p>Con un formato de 8.5” x 11” y letra grande de 18 puntos, es ideal para una experiencia relajante, cómoda y apta para todos.</p>
            </div>
        </div>
    </section>

    <!-- Contenido del Libro -->
    <section class="section">
        <h2>🎁 ¿Qué encontrarás dentro?</h2>
        <p>✅ 36 sopas de letras temáticas que refuerzan conceptos clave mientras estimulan tu mente y espíritu.</p>
        <p>✅ Afirmaciones y citas poderosas para mantenerte inspirado.</p>
        <p>✅ Espacios para reflexionar sobre tus logros, sueños y gratitudes.</p>
        <p>✅ Temas cuidadosamente seleccionados: Gratitud, Propósito, Abundancia Espiritual, Prosperidad Financiera y Relaciones Positivas.</p>
    </section>

    <!-- Beneficios -->
    <section class="section">
        <h2>🌟 Beneficios para tu vida</h2>
        <p>✔️ Reduce el estrés y mejora tu bienestar emocional.</p>
        <p>✔️ Fortalece tu enfoque en metas significativas.</p>
        <p>✔️ Convierte tus momentos de ocio en un ritual transformador.</p>
        <a href="#order" class="cta-button">¡Haz de Retos de Oro 2025 tu compañero esencial para este nuevo año!</a>
    </section>

    <!-- Footer -->
    <footer>
        <p>&copy; 2024 Retos de Oro. Todos los derechos reservados.</p>
    </footer>

</body>
</html>