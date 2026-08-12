-- HOY 2.33.0 · curated German menu localization for La Finca Restaurant (restaurant_id 216)
-- Source content remains in menu_items; prices are never translated or changed here.
insert into public.menu_item_translations (menu_item_id,locale,category,name,description,translation_status,updated_at) values
('b9fd567a-f6d0-4fb2-a50c-646b340327e0','de','Hauptgerichte','Hähnchenbrust','Mit cremiger Kokossauce und fruchtigem Reispilaw.','curated',now()),
('3af380b6-2f3e-4bf4-a349-004114780b99','de','Hauptgerichte','Risotto mit Karotte und Butternut-Kürbis','Mit Kirschtomaten, gerösteter Paprika, Pinienkernen und Parmesanspänen.','curated',now()),
('a9a3e7b5-431b-4b7c-baae-e02842b8e1b9','de','Hauptgerichte','Zweierlei von der Ente','Entenbrust und gezupftes Entenconfit in Filoteig, dazu würziger Portweinsirup und Pflaumensauce.','curated',now()),
('ffc7e7f3-c27a-40bf-be33-5e236a42c5cd','de','Hauptgerichte','Doradenfilet','Auf einem Kartoffelküchlein mit schwarzen Oliven und getrockneten Tomaten, dazu Romesco-Coulis und Parmesanspäne.','curated',now()),
('dc8190f0-e558-4d6f-bf4e-c06d0203c86b','de','Hauptgerichte','Rinderfilet','Nach Wunsch gegart, mit handgeschnittenen Pommes, Padrón-Paprika und confiertem Knoblauch; Pfeffersauce auf Wunsch.','curated',now()),
('b9d2de49-a6fa-41d4-ad4a-e5fda9b08c23','de','Hauptgerichte','Rinderfilet Stroganoff','Mit Paprika, Sahne, Zitronensaft, Pilzen und Petersilie.','curated',now()),
('59a8cde8-36dd-4b86-b2f0-e0950707a6e1','de','Hauptgerichte','Ofengebackener Teriyaki-Lachs','Mit Wokgemüse und Sojareis.','curated',now()),
('9bdbbfb0-d8b2-4843-959b-ea0b2ccfaeb3','de','Hauptgerichte','Gebratene Kalbsleber','Mit Rotwein, frischer Salbeibutter und Kartoffelcreme.','curated',now()),
('d264bbac-089f-4f14-a3bd-34dbd62cb314','de','Hauptgerichte','Langsam gegarter Schweinebauch','Mit knuspriger Kruste, Apfelsauce und Cidersirup.','curated',now()),
('5655ebee-e3cd-43ac-b8dc-166758e2cec8','de','Hauptgerichte','Würzig geschmorte Lammhaxe','Langsam in einer Tomaten-Mandel-Sauce geschmort, dazu Couscous.','curated',now()),
('0d97fdd9-bcd9-4d2d-9b42-6499bc111cbd','de','Vorspeisen','Rote-Bete-Carpaccio','Mit zerbröseltem Feta, gerösteten Nüssen, Feldsalat und Zitrusvinaigrette.','curated',now()),
('f97d5bff-392c-40c2-b83e-d845ee80370c','de','Vorspeisen','Entenleber','Mit Rucola, Apfel-Charlotte, Portweinsirup und eingelegten Äpfeln.','curated',now()),
('bed36ba7-392c-4d05-95c3-94f3f639e525','de','Vorspeisen','Hausgemachte Hühnerleberpastete','Dazu knusprige Toasts und Fruchtsauce.','curated',now()),
('6b8e69e2-f0b5-412c-9b17-e5b2597a9b2d','de','Vorspeisen','La Finca Garnelencocktail',null,'curated',now()),
('3095f4b3-cd98-422c-b98e-9bdd306c2cba','de','Vorspeisen','Kroketten vom gesalzenen Kabeljau','Mit hausgemachter Aioli.','curated',now()),
('2a198445-e675-4a44-ac3b-91dd1d001fd4','de','Vorspeisen','Melonenauswahl','Garniert mit frischen roten Früchten und Fruchtcoulis.','curated',now()),
('a2dcd186-d0a5-420a-96f3-3c41d90c3031','de','Vorspeisen','Sizilianische Fleischbällchen','Mit Tomatencoulis.','curated',now()),
('9530195c-ad6c-4836-969e-9a8dece42c2f','de','Vorspeisen','Räucherlachsplatte','Mit Wodka-Limetten-Sirup, rosa Pfefferkörnern, Zarenmayonnaise und Wakame.','curated',now()),
('163d1bec-067c-462b-9977-3d481a6ee578','de','Vorspeisen','Hummus-Trio','Mit Gemüsesticks und kleinen Broten.','curated',now())
on conflict (menu_item_id,locale) do update set category=excluded.category,name=excluded.name,description=excluded.description,translation_status=excluded.translation_status,updated_at=now();

-- Complete two previously curated Area Sunset descriptions so language coverage is truly complete per row.
update public.menu_item_translations set description='Mit Trüffel-Käse-Béchamel und gratinierter Ananas.',updated_at=now() where locale='de' and menu_item_id='7adf757b-666f-43be-84d8-56a0e33af961';
update public.menu_item_translations set description='Mit Romesco-Sauce und confiertem Lauch.',updated_at=now() where locale='de' and menu_item_id='510c46fb-ee17-433a-b23d-f9c6c5975f87';
