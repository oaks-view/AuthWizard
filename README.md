# AuthWizard

Auth wizard demonstrates the basic user authentication system. It aims to go a little lower level, i.e
carry out user authentication without leveraging out of the box authentication libraries like passportjs or meteorjs user-accounts.

## Features
* Signup - Basic user registration using email and password. Also includes relevant validations
* Login - Login using email and password to receive [jsonwebtoken](https://jwt.io/introduction/)

### Prerequisites
To setup and run the project, an individual machine requires a working version of node and npm.
This project was bootstraped using node --version v8.9.4 and npm 5.6.0. It is recommended to use at least this version of the node and npm dependencies. Here is a good tutorial on how to install nodejs
using [nvm](https://nodesource.com/blog/installing-node-js-tutorial-using-nvm-on-mac-os-x-and-ubuntu/).

## Install
Assuming that the project is already cloned. Open a new terminal window and navigate into the project directory and into the root folder. Then
* Run the following command `npm install`
* Next theres need to setup some environmental variables which are all listed in a `.env` file found
in the projects root directory.

## Run server
To run the project, in a terminal window navigate into the root directory of the project(if not there already) and run the command `npm start`. 
This will start the server in the port specified in the environmental variables(By default this is 3000.

## API documentation
Project includes a swagger doc `api-spec.json` found in the `doc` folder from the root directory. This provides details on featured endpoints. Simple run the app as described in the preceding step and visit the endpoint `/api-docs` in the `browser` and that will serve the documentation using `swagger-ui`.

## Running unit tests
The project uses mocha as a test runner. To run unit tests simply navigate to the root directory of the project and execute the following command `npm test`.

## Code coverage
To generate code coverage reports for the project execute the following command in the root directory of the project `npm run coverage`.
The coverage report can now be found in the `coverage` folder from the root directory.

## linting
In the root directory of the project execute the following command to run linting analysis 
`npm run lint`

## Author

oaks-view

## License

 - **ISC** : http://opensource.org/licenses/ISC
