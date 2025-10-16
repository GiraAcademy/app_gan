# 🚀 Instrucciones para Configurar GitHub Pages

## ✅ Estado Actual
- ✅ Repositorio creado: `git@github.com:GiraAcademy/app_gan.git`
- ✅ Código subido a la rama `main`
- ✅ Workflow de GitHub Actions configurado (`.github/workflows/deploy.yml`)
- ✅ Configuración de Vite para GitHub Pages (`base: '/app_gan/'`)

## 📋 Pasos para Habilitar GitHub Pages

### 1. Ir a la Configuración del Repositorio
1. Abre el repositorio en GitHub: https://github.com/GiraAcademy/app_gan
2. Haz clic en la pestaña **Settings** (⚙️ Configuración)

### 2. Configurar GitHub Pages
1. En el menú lateral izquierdo, busca y haz clic en **Pages**
2. En la sección **Build and deployment**:
   - **Source**: Selecciona "GitHub Actions"
   
   ![GitHub Pages Source](https://docs.github.com/assets/cb-47267/mw-1440/images/help/pages/pages-source-github-actions.webp)

### 3. Esperar el Deployment
1. Ve a la pestaña **Actions** en el repositorio
2. Verás que el workflow "Deploy to GitHub Pages" se está ejecutando
3. Espera a que termine (toma 1-2 minutos aproximadamente)
4. Cuando veas el ✅ verde, el sitio estará listo

### 4. Acceder al Sitio
Una vez completado el deployment, tu aplicación estará disponible en:

🌐 **https://giraacademy.github.io/app_gan/**

## 🔄 Deployments Automáticos

Cada vez que hagas `git push` a la rama `main`, GitHub Actions:
1. ✅ Instalará las dependencias (`npm ci`)
2. 🔨 Compilará la aplicación (`npm run build`)
3. 📦 Publicará el build en GitHub Pages
4. 🚀 Tu sitio se actualizará automáticamente

## 🐛 Solución de Problemas

### El workflow falla
- Verifica en **Actions** cuál fue el error
- Asegúrate de que `package.json` tenga todas las dependencias

### El sitio muestra página en blanco
- Verifica que `vite.config.js` tenga `base: '/app_gan/'`
- Revisa la consola del navegador para errores

### Los assets no cargan
- Asegúrate de usar rutas relativas en el código
- Verifica que las imágenes estén en la carpeta `public/`

## 📝 Comandos Útiles

```bash
# Ver estado del repositorio
git status

# Hacer cambios y subirlos
git add .
git commit -m "Descripción de cambios"
git push

# Ver logs de commits
git log --oneline

# Ver branches
git branch -a
```

## 🎉 ¡Listo!

Tu aplicación ahora está:
- ✅ Versionada en Git
- ✅ Respaldada en GitHub
- ✅ Publicada en GitHub Pages
- ✅ Con deployment automático configurado

---

**Última actualización:** 16 de Octubre, 2025
