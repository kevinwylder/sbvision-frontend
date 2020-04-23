const fs = require('fs');
const path = require('path');
const ip = require('ip');

function writeApiURL(url) {
  fs.writeFileSync("./src/api/url.ts", `
export const API_URL = "${url}";
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

  let url;
  let reactVersion;
  let mode;
  let watch;
  if (!env) {
    url = `https://api.skateboardvision.net`;
    reactVersion = `production.min`;
    mode = `production`;
    watch = false;
  } else {
    if (env.dev) {
      url = "https://api.skateboardvision.net";
    } else {
      url = "http://" + ip.address() + ":1080";
    }
    reactVersion = "development";
    mode = "development";
    watch = true;
  }

  writeApiURL(url);
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
      contentBase: path.join(__dirname, 'dist'),
      host: "0.0.0.0",
      historyApiFallback: {
        index: 'index.html'
      }
    }
  };
};
