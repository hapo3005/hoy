-- HOY 2.31 reference seed for the production-curated Soul Kitchen image menu.
-- Production data was curated from the official QR menu source; keep this file as reproducible reference only.
update public.menu_sources
set display_payload = jsonb_build_object(
  'type','image_pages',
  'version',1,
  'pages',jsonb_build_array(
    jsonb_build_object('section','Food','label','Food 1','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2026/05/01SOULa--scaled.jpg?fit=327%2C1024&ssl=1'),
    jsonb_build_object('section','Food','label','Food 2','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2026/05/02SOULa--scaled.jpg?fit=327%2C1024&ssl=1'),
    jsonb_build_object('section','Food','label','Food 3','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2026/05/03SOULa--scaled.jpg?fit=327%2C1024&ssl=1'),
    jsonb_build_object('section','Food','label','Food 4','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2026/05/04SOULa-copia-scaled.jpg?fit=357%2C1024&ssl=1'),
    jsonb_build_object('section','Food','label','Food 5','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2024/07/05SOULa-scaled.jpg?fit=327%2C1024&ssl=1'),
    jsonb_build_object('section','Food','label','Food 6','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2026/05/06SOULab.jpg?fit=395%2C1024&ssl=1'),
    jsonb_build_object('section','Drinks','label','Drinks 1','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2026/05/06soulcafe-scaled.jpg?fit=480%2C1024&ssl=1'),
    jsonb_build_object('section','Drinks','label','Drinks 2','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2026/07/01soulcervezz-scaled.jpg?fit=384%2C1024&ssl=1'),
    jsonb_build_object('section','Drinks','label','Drinks 3','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2025/07/vinos06-scaled.jpg?fit=566%2C1024&ssl=1'),
    jsonb_build_object('section','Drinks','label','Drinks 4','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2025/07/chupitosj-scaled.jpg?fit=642%2C1024&ssl=1'),
    jsonb_build_object('section','Drinks','label','Drinks 5','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2024/07/03soulbebidav-scaled.jpg?fit=465%2C1024&ssl=1'),
    jsonb_build_object('section','Drinks','label','Drinks 6','url','https://i0.wp.com/menurestauranteqr.es/wp-content/uploads/2025/07/coctelsin.jpg?fit=825%2C660&ssl=1')
  )
)
where restaurant_id=(select id from public.restaurants where slug='soul-kitchen' limit 1)
  and source_url='https://menurestauranteqr.es/soulkitchen/';
