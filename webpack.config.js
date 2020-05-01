const fs = require('fs');
const path = require('path');
const ip = require('ip');
const bodyParser = require('body-parser');

function writeConstants(url, logURL, defaultToken) {
  fs.writeFileSync("./src/constants.ts", `
export const API_URL = "${url}";
export const LOG_URL = ${ logURL ? `"${logURL}"` : "undefined" };
export const DEFAULT_TOKEN = ${ defaultToken ? `"${defaultToken}"` : "undefined" };
  `);
}

function writeIndexHTML(mode) {
  if (!fs.existsSync("./dist")) {
    fs.mkdirSync('./dist');
  }
  fs.copyFileSync(`./node_modules/react/umd/react.${mode}.js`, `./dist/react.${mode}.js`);
  fs.copyFileSync(`./node_modules/react-dom/umd/react-dom.${mode}.js`, `./dist/react-dom.${mode}.js`);
  fs.copyFileSync(`./node_modules/react-router-dom/umd/react-router-dom.min.js`, `./dist/react-router-dom.min.js`);
  fs.writeFileSync("./dist/index.html", `
<head>
  <title> Skateboard Vision Project </title>

  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>

  <div id="root"/>
  <script type="text/javascript" src="/react.${mode}.js"></script>
  <script type="text/javascript" src="/react-dom.${mode}.js"></script>
  <script type="text/javascript" src="/react-router-dom.min.js"></script>
  
  <script type="text/javascript" src="/main.js"></script>

</body>
  `)
}

module.exports = env => {

  let url = `https://api.skateboardvision.net`;
  let reactVersion;
  let mode;
  let watch;
  let defaultToken;
  let logURL;
  if (!env || env.production) {
    reactVersion = `production.min`;
    mode = `production`;
    watch = false;
  } else {
    reactVersion = "development";
    mode = "development";
    watch = true;
    if (env.token) {
      defaultToken = env.token;
      logURL = "http://" + ip.address() + ":8080";
    }
    if (env.api) {
      url = env.api;
    }
  }

  writeConstants(url, logURL, defaultToken);
  writeIndexHTML(reactVersion);

  return {
    mode,
    watch,
    module: {
      rules: [
        {
          test: /\.ts(x)?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader'
          ]
        }
      ],
    },
    devtool: 'inline-source-map',
    resolve: {
      extensions: [ '.ts', '.js', '.tsx' ],
    },
    entry: "./src/index.tsx",
    externals: {
      "react": "React",
      "react-dom": "ReactDOM",
      "react-router-dom": "ReactRouterDOM"
    },
    devServer: {
      before: function(app, server, compiler) {
        app.use(bodyParser.text());
        app.post("/log", function(req, res) {
          console.log("\t/log " + req.body);
          res.status(200).send();
        })
      },
      contentBase: path.join(__dirname, 'dist'),
      host: (logURL) ? "0.0.0.0" : undefined,
      historyApiFallback: {
        index: 'index.html'
      }
    }
  };
};
