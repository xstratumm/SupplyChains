Used:
https://docs.djangoproject.com/en/5.0
https://developer.mozilla.org/en-US/docs/Learn/Server-side/Django
https://neomodel.readthedocs.io/en/latest
https://github.com/neo4j-contrib/django-neomodel
https://google.github.io/styleguide/pyguide.html
https://dev.to/nagatodev/how-to-connect-django-to-reactjs-part-2-2oje
shit:
https://dev.to/afrozansenjuti/a-definitive-guideline-for-creating-apis-with-django-and-neo4j-database-part-1-3lg0
Сначала хотел получать ноды и связи так:
https://neo4j-examples.github.io/paradise-papers-django/tutorial/part06.html
Потом передумал и перешел на простые запросы к Cypher
Не использовал, но полезно:
http://webcache.googleusercontent.com/search?q=cache:https://medium.com/swlh/create-rest-api-with-django-and-neo4j-database-using-django-nemodel-1290da717df9&strip=0&vwsrc=1&referer=medium-parser

Project launch:
0. pip install -r requirements.txt
1. Start (empty for the first time) Neo4J SupplyChains database and
change NEOMODEL_NEO4J_BOLT_URL in supply_chains/settings.py (username neo4j and passwd used when creating db)
2. python manage.py runserver
3. Start localhost:8000 in your browser

After editing models.py run:
python manage.py install_labels

Not to execute twice apps.py/ready use:
python manage.py runserver --noreload
(turns off auto reloading server after changing code)

For interactive shell:
python manage.py shell