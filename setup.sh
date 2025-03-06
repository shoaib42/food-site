#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Error: Missing arguments."
    echo "Usage: $0 <work_dir> <web_server> [root_path]"
    echo "  <work_dir>: Local working directory (e.g., 'myapp')."
    echo "  <web_server>: Web server type ('apache' or 'nginx')."
    echo "  [root_path]: Optional root path for the web server (e.g., 'myapp', not '/myapp'). Defaults to empty (the root of the domain)."
    exit 1
fi

wdir=$1
web=$2
rootPath=${3:-""}

if [ "$web" != "apache" ] && [ "$web" != "nginx" ]; then
    echo "Configurations only provided for 'apache' or 'nginx'. You'll have to configure on your own for '$web'"
fi

rt_dir=$(pwd)

echo "Building React app..."
cd food/react
npm install
npm run build
cd -

echo "Setting up working directory..."
mkdir -p output/$wdir
cd output/$wdir
cp -r $rt_dir/food/php food
cp -r $rt_dir/food/react/build/* food/.
cp -r $rt_dir/sitechange .
mkdir sitechange/sitedata
cp -r $rt_dir/main/* .
cp -r $rt_dir/main/.htaccess .

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i "" "s|foobar|$rootPath|g" defs.php #Mac has to do things differently!
else
    sed -i "s|foobar|$rootPath|g" defs.php
fi
cd -


if [ "$web" == "apache" ]; then
    echo "Generating Apache configuration..."
    cat <<EOF > output/${wdir}_apache.conf
Alias /$rootPath "/var/www/$wdir/"

<Directory /var/www/$wdir/>
  Require all granted
  AllowOverride All
  <IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "POST, GET, OPTIONS, DELETE, PUT"
    Header always set Access-Control-Allow-Headers "Content-Type"
    Header always set Access-Control-Max-Age "600"
  </IfModule>
  DirectoryIndex index.php index.html
</Directory>
EOF
elif [ "$web" == "nginx" ]; then
    echo "Generating Nginx configuration..."
    cat <<EOF > output/${wdir}_nginx.conf
server {
    listen 80;
    server_name your_domain_or_ip;  # Replace with your domain or IP

    root /var/www/$wdir;
    index index.php index.html;

    # Serve static files directly
    location ~* \.(html|css|js|png|jpg|jpeg|gif|ico|svg|ttf|woff|woff2)$ {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "POST, GET, OPTIONS, DELETE, PUT";
        add_header Access-Control-Allow-Headers "Content-Type";
        add_header Access-Control-Max-Age "600";
        try_files \$uri =404;
    }

    # Rewrite rules to remove .php extensions
    location / {
        try_files \$uri \$uri/ @rewrite;
    }

    location @rewrite {
        rewrite ^/([^/]+)/?$ /$1.php last;
    }

    # Handle PHP files
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;  # Adjust PHP version and socket path
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    # Handle CORS preflight requests
    if (\$request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "POST, GET, OPTIONS, DELETE, PUT";
        add_header Access-Control-Allow-Headers "Content-Type";
        add_header Access-Control-Max-Age "600";
        add_header Content-Type 'text/plain charset=UTF-8';
        add_header Content-Length 0;
        return 204;
    }
}
EOF
fi


echo
echo "-------------------------------------------------------------------------------"
echo "Setup Instructions"
echo "-------------------------------------------------------------------------------"
echo "1. Create $wdir/sitechange/sitedata/site_data.json with your site rotation history."
echo "    Use the $wdir/sitechange/site_data.json.sample as a reference"
echo
echo "2. Copy the directory $wdir to /var/www/$wdir:"
echo "   sudo cp -r $wdir /var/www/$wdir"
echo
echo "3. Use the script in $wdir/tools/register_user.php to create users and add them to $wdir/users.php"
echo
echo "4. Initialize the SQLite database:"
echo "   cd /var/www/$wdir/food/"
echo "   php tools/init_sqlite.php" 
echo "   Alternatively, update the configs for MySQL in $wdir/food/config.php"
echo
echo "5. Change ownership of the directory /var/www/$wdir to the web server user:"
echo "   sudo chown -R www-data:www-data /var/www/$wdir"
echo


if [ "$web" == "apache" ]; then
    echo "6. For Apache:"
    echo "   Copy the ${wdir}_apache.conf file to /etc/apache2/sites-available/${wdir}.conf:"
    echo "   sudo cp ${wdir}_apache.conf /etc/apache2/sites-available/${wdir}.conf"
    echo "   Enable the site and reload Apache:"
    echo "   sudo a2ensite $wdir && sudo systemctl reload apache2"
elif [ "$web" == "nginx" ]; then
    echo "6. For Nginx:"
    echo "   Copy the ${wdir}_nginx.conf file to /etc/nginx/sites-available/$wdir.conf:"
    echo "   sudo cp ${wdir}_nginx.conf /etc/nginx/sites-available/$wdir.conf"
    echo "   Enable the site and reload Nginx:"
    echo "   sudo ln -sf /etc/nginx/sites-available/$wdir.conf /etc/nginx/sites-enabled/"
    echo "   sudo systemctl reload nginx"
else
    echo "6. Configurations not available for $web server. Configure manually."
fi

echo
echo "-------------------------------------------------------------------------------"
echo "Setup complete. Follow the instructions above to deploy your application."
echo "-------------------------------------------------------------------------------"