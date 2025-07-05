## Install and run the app on your computer

First, git clone this git repository with git clone followed by the URL of the git:

```shell
git clone git@github.com:paulpacaud/deepmind-gemma-frontend.git
```

Then go in the directory, and stay in it for the following commands.

```shell
cd deepmind-gemma-frontend.git
```

Make sure that Node.js, npm (Node Package Manager), yarn, and angular are correctly installed

```shell
node --version
yarn --version
ng --version
```

If needed, install Node.js from https://nodejs.org (npm will be installed along Node)

If needed, you can install Angular like this:

```shell
yarn global add @angular/cli
```

And finally, before running the app, you have to install all the dependencies of the project:

```shell
yarn install
```

Warning: please make sure to activate prettier "run on save" in your IDE, so that the code is formatted automatically when you save it.

## Running the app

Great! Everything is installed, you can now run the frontend app

```shell
yarn watch
```

To see your application in the browser, go to http://localhost:4200/.
