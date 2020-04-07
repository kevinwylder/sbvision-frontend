# skateboard vision frontend

This is the web application code to contribute to the skateboard vision project. Originally this was a directory and build step of the backend, but not it has a separate repo.

[the skateboard vision project](https://github.com/kevinwylder/sbvision), but now it has a separate repo.



### dev environment

`yarn dev` starts webpack in watch mode, and builds the API package pointed to https://sbvision.kwylder.com.

### backend dev environment

`yarn local` starts webpack in watch mode just like the dev environment, but points the api at `http://localhost:1080` for testing with [sbvision's docker-compose setup](https://github.com/kevinwylder/sbvision)

### production build

`yarn build` runs a production webpack build into the `./dist` directory, and points the api at https://sbvision.kwylder.com
