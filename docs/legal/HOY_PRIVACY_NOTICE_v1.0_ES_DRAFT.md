# HOY — Política de Privacidad v1.0 — ES

**Estado:** BORRADOR DE LOCALIZACIÓN JURÍDICA / NO ACTIVO  
**Versión:** 1.0  
**Fecha:** 18-08-2026  
**Responsable:** `[ENTIDAD JURÍDICA HOY — PENDIENTE]`  
**Domicilio:** `[PENDIENTE]`  
**Contacto de privacidad:** `[PENDIENTE]`

> Este documento es un borrador de localización para revisión jurídica española. No debe publicarse como política activa hasta completar entidad responsable, bases jurídicas, plazos de conservación, destinatarios/subencargados, transferencias internacionales, cookies/analítica, derechos y revisión legal.

## 1. Ámbito

La versión final cubrirá, según proceda:

- visitantes y usuarios de HOY;
- representantes de restaurantes, empresas y prestadores;
- cuentas, reclamaciones de perfil y verificaciones;
- aceptación de condiciones y confirmaciones de datos;
- contactos profesionales usados para investigación comercial interna;
- seguridad, auditoría y soporte;
- futuros flujos de HOY Works.

## 2. Principio de HOY

Los datos personales no se tratan como una mercancía propiedad de HOY. Cada tratamiento debe tener finalidad, rol, base jurídica, minimización, conservación, destinatarios/transferencias, medidas de seguridad y mecanismos para derechos de los interesados.

## 3. Analítica del producto

HOY Gastro contiene actualmente identificadores seudónimos `anonymous_id` y `session_id` asociados a eventos y metadatos limitados del producto.

La seudonimización no convierte automáticamente esos datos en anónimos. Antes del lanzamiento público deben resolverse la base jurídica y las reglas aplicables a cookies o tecnologías de almacenamiento/acceso en terminales.

Los eventos históricos anteriores al corte limpio 2.45 no se utilizarán como prueba fiable de tracción de usuarios.

## 4. Cuentas y representantes de empresas

Podrán tratarse datos como correo profesional, identificador de usuario, rol, membership, prueba de autoridad, acciones del operador y evidencias contractuales.

La base jurídica concreta se asignará por actividad antes de activación.

## 5. Contactos profesionales y prospección

HOY mantiene actualmente una cartera interna de posibles empresas con determinados datos profesionales de contacto.

El tratamiento de datos profesionales para relacionarse con una persona jurídica se analizará separadamente del envío de comunicaciones comerciales electrónicas.

**Gate:** disponer de un correo profesional no autoriza automáticamente a HOY a enviar publicidad o promoción no solicitada. El bloqueo de outreach permanece activo hasta la revisión específica de LSSI/canal/relación.

## 6. HOY Works

El esquema de Works contempla futuros datos como usuario/cliente, descripción del trabajo, localidad y coordenadas.

Actualmente el proyecto auditado no contiene cuentas, perfiles ni solicitudes reales de trabajo.

Antes de activar ese flujo se exige revisión P0 de minimización de ubicación, textos libres, destinatarios/proveedores, conservación, derechos, seguridad, DPIA screening y roles controller/processor.

## 7. Encargados, proveedores y transferencias

Supabase es actualmente un proveedor técnico central para base de datos, Auth, Storage, APIs y Edge Functions.

La base de datos principal se encuentra en `eu-central-1` (Frankfurt), pero esto no demuestra por sí solo que todas las operaciones permanezcan dentro del EEE. Se revisarán Edge Functions, subprocessadores, soporte y cualquier otro proveedor.

Las transferencias internacionales solo podrán producirse con una base válida del capítulo V RGPD.

## 8. Conservación

HOY mantendrá un Registro de Retención. Ningún dato se conservará indefinidamente por defecto.

Los plazos aún no aprobados se consideran `REVIEW_REQUIRED` y no son política definitiva.

## 9. Derechos

La versión activa explicará y permitirá ejercer, cuando resulten aplicables, los derechos de acceso, rectificación, supresión, limitación, portabilidad, oposición y retirada del consentimiento.

Antes de activación se definirá un canal verificable para solicitudes y un registro interno de evidencia.

## 10. Cookies y tecnologías similares

Antes del lanzamiento se inventariarán cookies, localStorage y otros identificadores. Los mecanismos no necesarios no se activarán hasta disponer de la información y consentimiento exigibles.

## 11. Seguridad

HOY aplica un enfoque basado en riesgo: autenticación, mínimo privilegio, RLS/autorización servidor, separación de tablas privadas, migraciones versionadas, QA/Security Advisor, provenance/audit y gestión segura de secretos.

## 12. Activación

Esta versión permanece bloqueada hasta completar al menos:

- [ ] entidad jurídica y contacto de privacidad;
- [ ] matriz Controller/Processor;
- [ ] base jurídica por actividad;
- [ ] conservación;
- [ ] proveedores/subprocesadores y transferencias;
- [ ] cookies/analítica;
- [ ] flujo de derechos;
- [ ] revisión jurídica DE/ES;
- [ ] SHA-256 finales;
- [ ] vinculación con Business Terms.

**NO ACTIVAR** antes de completar los requisitos P0.