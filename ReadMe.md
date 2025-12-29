![Avalverde](include image path)
<center><a href="www.adelavalverde.info" target="_blank">Click here to visit the site</a> - <a href="https://github.com/EL1909/adevalverde" target="_blank">Click here to visit repository</a></center>

Project Brief: Adela Valverde Website
Overview
The adevalverde project is a Django-based web application designed as a personal platform for Adela Valverde. It combines a personal portfolio/timeline with a fully functional e-commerce store for physical and digital products.

Architecture
Framework: Django 4.2.7
Database: SQLite (default for development)
Frontend: Django Templates with HTML, CSS, and JavaScript (AJAX used for forms).
Authentication: Standard Django Auth with custom views for Login/Signup.
## Project Structure & Apps

### 1. Store App (`/store/`)
A comprehensive e-commerce solution for physical and digital products.

**Models:**
-   **Category**: Organizes products into groups.
-   **Provider**: Manages product suppliers.
-   **Product**: The core item model. Supports physical and digital items (via `is_digital` and `download_file`).
-   **Order**: Manages customer orders, payment status, and shipping data.
-   **OrderItem**: Links products to orders with specific quantities and prices.
-   **Downloadable**: Manages secure digital downloads with UUID tokens and QR codes.

**Views:**
-   **CategoryView**: Admin view for managing categories.
-   **InventoryManagementView**: Admin dashboard for managing products, orders, and categories.
-   **Cart**: Handles shopping cart operations (add, remove, update, clear).
-   **ManageOrder**: Handles order updates and fulfillment logic.
-   **Product Views**: `product_detail`, `all_products`, `add_product`, `edit_product`, `delete_product`.

### 2. Key Moments App (`/keymoments/`)
A timeline feature to showcase life events.

**Models:**
-   **KeyMoment**: Represents an event with title, description, date, image, and type (Social, Academic, Work).

**Views:**
-   **key_moments_list**: Displays the timeline of moments.
-   **create_key_moment**: Allows creating new moments (requires login).
-   **edit_key_moment**: Allows editing existing moments.
-   **delete_key_moment**: Allows deleting moments.

### 3. Home App (`/home/`)
Handles static pages and the main landing page.

**Views:**
-   **HomeIndex**: Renders the homepage.
-   **Bio**: Renders the biography page.
-   **Privacy**: Renders the privacy policy.
-   **TyC**: Renders the terms and conditions.

### 4. Accounts App (`/accounts/`)
Manages user authentication and cart merging.

**Features:**
-   **Authentication**: Integrates with `django-allauth` for login, signup, and logout.
-   **Cart Merging**: Custom logic to merge a guest's shopping cart with their user account upon login or registration.



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
                
                $ gunicorn --bind 127.0.0.1:8082 adevalverde.wsgi:application

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







X-X   client requests   X-X












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











REVISION CON ADELA 06.02.2025

EN EL INICIO, COLOCAR INFORMACION DEL LIBRITO DEL ORO

sec.1    Colocar imagen de adela en el inicio con acceso a workshop mas reciente
    
sec.2    Workshops con diferentes niveles
            habilitar creacion de fecha para un evento en vivo con el acceso al taller 

sec.3    Acceso a otros libros

sec.4    Acceso a nformacion de Reinicio


        Correos de bienvenida a suscriptores




That's a smart approach\! Focusing on the correct, clean process will save you significant time next time.

Here is a concise, step-by-step blueprint for deploying a Django application with Gunicorn and Nginx using a UNIX socket, which bypasses all the errors we just solved.

## 🚀 Django Deployment Blueprint (Gunicorn & Nginx)

This guide assumes your Django project code is ready on the server, a dedicated user (`<user>`) exists, and a Python virtual environment is set up.

-----

## 1\. ⚙️ Prepare the Django Environment

| Step | Command / Action | Purpose |
| :--- | :--- | :--- |
| **A. Create Socket Path** | Manually create a dedicated socket file path within your project folder, as system directories (`/run/`) cause permission errors. | Ensures Gunicorn can write the socket file. |
| **B. Environment File** | Create the `.env` file (e.g., at `~/projects/<project_name>/.env`) with necessary variables: `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, and `DATABASE_URL`. | Prevents immediate Python configuration crash on startup. |
| **C. Permissions** | Set secure permissions for the `.env` file. | Secures environment variables. |

-----

## 2\. 🦄 Configure and Enable Gunicorn

Create the Gunicorn service file at `/etc/systemd/system/gunicorn_<project_name>.service`. Pay close attention to the **socket path** and **working directory**.

| Directive | Correct Value | Purpose |
| :--- | :--- | :--- |
| `User` | `<user>` (e.g., `efrain19091`) | Runs the application as your dedicated user. |
| `Group` | `www-data` | **Crucial Fix:** Allows Nginx (which runs as `www-data`) to access the socket. |
| `UMask` | `007` | **Crucial Fix:** Sets socket permissions for group access. |
| `WorkingDirectory` | `/home/<user>/projects/<project_name>/<inner_project>/` | **Crucial Fix:** Must point to the folder containing `manage.py`. |
| `ExecStart` | `... --bind unix:/home/<user>/projects/<project_name>/gunicorn.sock ...` | Binds to the secure, user-accessible socket path. |

### Gunicorn Service Commands

1.  **Reload Daemon:** `sudo systemctl daemon-reload`
2.  **Enable Service:** `sudo systemctl enable gunicorn_<project_name>`
3.  **Start Service:** `sudo systemctl start gunicorn_<project_name>`

-----

## 3\. 🌐 Configure and Enable Nginx

Create the server block file at `/etc/nginx/sites-available/<project_name>`. The final configuration is split into two `server` blocks to handle HTTP (80) and HTTPS (443) cleanly.

### A. HTTP Block (Port 80)

This block's **only** job is to redirect all HTTP traffic to HTTPS.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    # Certbot creates these lines for automatic HTTP to HTTPS redirect
    return 301 https://$host$request_uri; 
}
```

### B. HTTPS Block (Port 443)

This block handles the secure traffic, serving static/media files directly and proxying application requests to Gunicorn.

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl ipv6only=on;
    server_name example.com www.example.com;

    # --- 1. GUNICORN PROXY ---
    location / {
        # CRUCIAL FIX: Use the same user-accessible socket path
        proxy_pass http://unix:/home/<user>/projects/<project_name>/gunicorn.sock:/;
        
        # CRUCIAL FIX: Tells Django the original protocol was HTTPS (prevents redirect loops)
        proxy_set_header X-Forwarded-Proto $scheme; 

        # Standard proxy headers (Host, IP, etc.)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # --- 2. STATIC & MEDIA FILES (Served directly by Nginx) ---
    location /static/ {
        alias /var/www/<project_name>/html/static/;
    }
    location /media/ {
        alias /var/www/<project_name>/html/media/;
    }

    # ... (include Certbot SSL directives here)
}
```

### Nginx Service Commands

1.  **Test Config:** `sudo nginx -t`
2.  **Restart Service:** `sudo systemctl restart nginx`

-----

## 4\. 🔒 Final Django Security Setting

To ensure Django trusts the `X-Forwarded-Proto` header Nginx is sending, add this line to your **`settings.py`** file:

```python
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

This completes the clean, end-to-end setup that prevents both the 502 and the redirect loop errors.