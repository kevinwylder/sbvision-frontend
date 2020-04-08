const fs = require('fs');
const path = require('path');

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
  fs.writeFileSync("./dist/index.html", `
<head>
  <title> Skateboard Vision Project </title>

  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>

  <div id="root"/>
  <script type="text/javascript" src="./react.${mode}.js"></script>
  <script type="text/javascript" src="./react-dom.${mode}.js"></script>
  <script type="text/javascript" src="./main.js"></script>

</body>
  `)
}

module.exports = env => {

  if (env && env.url) {
    writeApiURL(env.url);
  } else {
    writeApiURL(`https://api.skateboarvision.net`);
  }

  let isDev = env && env.dev;
  if (isDev) {
    writeIndexHTML("development");
  } else {
    writeIndexHTML("production.min");
  }


  return {
    mode: (isDev) ? "development" : "production",
    watch: isDev,
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
      "react-dom": "ReactDOM"
    },
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
    }
  };
};
