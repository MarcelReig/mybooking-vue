/*
 *
 * Gulp tasks for mybooking static websites.
 *
 * Table of contents:
 *   Fonts
 *   Panini
 *   Sitemap
 *   Styles
 *   jQuery UI Images
 *   Scripts
 *   Images
 *   Local Server
 *   Run all in order
 *   Watch
 *   Default & production tasks
 *
 */

"use strict";

// Define variables
import plugins from "gulp-load-plugins";
import yargs from "yargs";
import browser from "browser-sync";
import gulp from "gulp";
import panini from "panini";
import rimraf from "rimraf";
import yaml from "js-yaml";
import fs from "fs";
import webpackStream from "webpack-stream";
import webpack2 from "webpack";
import named from "vinyl-named";
import i18n from "gulp-html-i18n";
import autoprefixer from "autoprefixer";

// Load all Gulp plugins into one variable
const $ = plugins();

// Check for --production flag
const PRODUCTION = !!yargs.argv.production;

// Load settings from settings.yml
const { PORT, PATHS } = loadConfig();

// Config
function loadConfig() {
  let ymlFile = fs.readFileSync("config.yml", "utf8");
  return yaml.load(ymlFile);
}

// Delete "dist" and "tmp" folders
function clean(done) {
  rimraf(PATHS.dist, done);
  rimraf(PATHS.tmp, done);
}

// -----------------------------------------------------------------------------
//   Fonts
// -----------------------------------------------------------------------------

//  Copy Inter fonts into dist folder
function build_fonts() {
  return gulp
    .src(PATHS.fonts + "/*.{woff,woff2,eot,svg,ttf}")
    .pipe(gulp.dest(PATHS.dist + "/assets/fonts"));
}

// Copy Fontawesome fonts into dist folder
function fontawesome() {
  return gulp
    .src(
      "./node_modules/@fortawesome/fontawesome-free/webfonts/*.{woff,woff2,eot,svg,ttf}"
    )
    .pipe(gulp.dest(PATHS.dist + "/assets/fonts/fontawesome"));
}

// Copy Slick-carousel fonts into dist folder
function slick_carousel() {
  return gulp
    .src("./node_modules/slick-carousel/slick/fonts/*.{woff,woff2,eot,svg,ttf}")
    .pipe(gulp.dest(PATHS.dist + "/assets/fonts/slick"));
}

// Copy Slick-carousel loader into dist folder
function slick_loader() {
  return gulp
    .src("./node_modules/slick-carousel/slick/*.gif")
    .pipe(gulp.dest(PATHS.dist + "/assets/images"));
}

// -----------------------------------------------------------------------------
//   Panini
// -----------------------------------------------------------------------------

// Convert page templates into finished HTML files in tmp folder for translation
function pages() {
  return gulp
    .src("src/pages/**/*.html")
    .pipe(
      panini({
        root: "src/pages/",
        layouts: "src/layouts/",
        partials: "src/partials/",
        data: "src/data/",
        helpers: "src/helpers/",
      })
    )
    .pipe(gulp.dest(PATHS.tmp));
}

// -----------------------------------------------------------------------------
//   i18-html-gulp
// -----------------------------------------------------------------------------

// Translate task (i18-html-gulp)
function translate() {
  return gulp
    .src(PATHS.tmp + "/**/*.html")
    .pipe(
      i18n({
        langDir: "./src/lang",
        createLangDirs: true,
        defaultLang: "es",
        trace: true,
        delimiters: ["<%=", "%>"],
        langRegExp: /<%= ?([\w-.]+) %>/g,
      })
    )
    .pipe(gulp.dest(PATHS.dist));
}

// Load updated HTML templates and partials into Panini
function resetPages(done) {
  panini.refresh();
  done();
}

// -----------------------------------------------------------------------------
//  Styles
// -----------------------------------------------------------------------------

// Compile Sass into CSS
// In production, the CSS is compressed
function sass() {
  const postCssPlugins = [autoprefixer()].filter(Boolean);

  return gulp
    .src("src/assets/scss/app.scss")
    .pipe($.sourcemaps.init())
    .pipe(
      $.sass({
        includePaths: PATHS.sass,
      }).on("error", $.sass.logError)
    )
    .pipe($.postcss(postCssPlugins))
    .pipe(
      $.if(
        PRODUCTION,
        $.cleanCss({
          compatibility: "ie9",
        })
      )
    )
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(PATHS.dist + "/assets/css"))
    .pipe(
      browser.reload({
        stream: true,
      })
    );
}

// -----------------------------------------------------------------------------
//   Copy Stuff into dist folder
// -----------------------------------------------------------------------------

// Copy jQuery UI images into dist css folder
function cssimages() {
  return gulp
    .src("./src/assets/scss/vendor/jquery.ui.custom/images/*.{jpg,gif,png}")
    .pipe(gulp.dest(PATHS.dist + "/assets/css/images"));
}

// Copy video into  the dist folder
function video() {
  return gulp
    .src("src/assets/video/*{.mp4,jpg}")
    .pipe(gulp.dest(PATHS.dist + "/assets/video"));
}

// Copy mybooking engine JS into the "dist" folder
function myBookingEngine() {
  return gulp
    .src([
      "src/assets/js/lib/mybooking-engine-init.js",
      "src/assets/js/lib/mybooking-engine-init-activities.js",
      "./node_modules/mybooking-js-engine/dist/js/mybooking-js-engine.js",
    ])
    .pipe(gulp.dest(PATHS.dist + "/assets/js"));
}

// Copy robots.txt and sitemap.xml into the "dist" folder
function robotsSitemap() {
  return gulp
    .src(["src/robots.txt", "src/sitemap.xml"])
    .pipe(gulp.dest(PATHS.dist));
}

// -----------------------------------------------------------------------------
//   Scripts with webpack
// -----------------------------------------------------------------------------

let webpackConfig = {
  mode: PRODUCTION ? "production" : "development",
  module: {
    rules: [
      {
        test: /.js$/,
        use: [
          {
            loader: "babel-loader",
          },
        ],
      },
    ],
  },
  resolve: {
    modules: [
      "node_modules",
      "src/assets/js/lib", // To be able to use libraries
    ],
  },
};

// Combine JavaScript into one file
// In production, the file is minified
function javascript() {
  return gulp
    .src(PATHS.entries)
    .pipe(named())
    .pipe($.sourcemaps.init())
    .pipe(webpackStream(webpackConfig, webpack2))
    .pipe(
      $.if(
        PRODUCTION,
        $.uglify().on("error", (e) => {
          console.log(e);
        })
      )
    )
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(PATHS.dist + "/assets/js"));
}

// -----------------------------------------------------------------------------
//   Images
// -----------------------------------------------------------------------------

// Copy images to the "dist" folder
// In production, the images are compressed
function images() {
  return gulp
    .src("src/assets/images/**/*")
    .pipe(
      $.if(
        PRODUCTION,
        $.imagemin({
          progressive: true,
        })
      )
    )
    .pipe(gulp.dest(PATHS.dist + "/assets/images"));
}

// -----------------------------------------------------------------------------
//   Localhost Server for development
// -----------------------------------------------------------------------------

// Start a server with BrowserSync
function server(done) {
  browser.init({
    server: PATHS.dist,
    port: PORT,
  });
  done();
}

// Reload the browser with BrowserSync
function reload(done) {
  browser.reload();
  done();
}

// -----------------------------------------------------------------------------
//    Run all in order
// -----------------------------------------------------------------------------

// Build the "dist" folder by running all of the below tasks
gulp.task(
  "build",
  gulp.series(
    clean,
    pages,
    sass,
    javascript,
    myBookingEngine,
    robotsSitemap,
    images,
    build_fonts,
    fontawesome,
    slick_carousel,
    slick_loader,
    translate,
    cssimages,
    video
  )
);

// -----------------------------------------------------------------------------
//   Watch
// -----------------------------------------------------------------------------

// Watch for changes to static assets, pages, Sass, and JavaScript
function watch() {
  gulp
    .watch("src/pages/**/*.html")
    .on("all", gulp.series(pages, browser.reload));
  gulp
    .watch("src/{layouts,partials}/**/*.html")
    .on("all", gulp.series(resetPages, pages, translate, browser.reload));
  gulp.watch("src/assets/scss/**/*.scss").on("all", sass);
  gulp
    .watch("src/assets/js/**/*.js")
    .on("all", gulp.series(javascript, browser.reload));
  gulp
    .watch("src/assets/img/**/*")
    .on("all", gulp.series(images, browser.reload));
  gulp.watch("tmp/**/*.html").on("all", gulp.series(translate, browser.reload));
}

// -----------------------------------------------------------------------------
//   Default task
// -----------------------------------------------------------------------------

// Build the site, run the server, and watch for file changes
gulp.task("default", gulp.series("build", server, watch));

// NPM scripts:
// For development execute: gulp start
// For production execute: yarn run build

// export tasks
exports.clean = clean;
