# sls-ci
[![CircleCI](https://circleci.com/gh/giusedroid/sls-ci.svg?style=svg)](https://circleci.com/gh/giusedroid/sls-ci)  

## What?
This is a sample serverless application built with Serverless Framework and deployed via CircleCI to my AWS Lab.  
The application itself is just a Lambda behind an API Gateway.  
The intersting part is in `.circleci/config.yml`.  

## Why?
Wanted to try out CircleCI, a nice container native CI/CD tool with a reasonable free tier.  
Also, will probably use this to showcase CircleCI to clients / stakeholders.  

## How?
1. Fork it
2. Get a CircleCI free account [here](https://circleci.com)
3. Create a user in your AWS account for CircleCI, add sensible permissions, export programmatic keys
4. In your CircleCI account, add a new project pointing to your forked repo
5. In your project settings, add your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to the build env variables
6. Make the changes you wish to the code
7. Run tests locally (see next section)
8. Watch it build.
9. Profit (?)

## How (Locally)?
Export your AWS credentials
```bash
export AWS_ACCESS_KEY_ID=<CircleCI User Key Id>
export AWS_SECRET_ACCESS_KEY=<CircleCI User Secret Key>
```
Install Serverless Framework
```bash
npm i -g serverless
```
Install Dependencies
```bash
npm i
```
Run Unit Tests
```bash
npm test
```
Deploy manually
```bash
sls deploy --stage manual
```
To run end to end tests, you'll have to provide your deployed API url in `./serverless-info.json`.  
For example
```json
{
    "ServiceEndpoint": "https://<YOUR API GATEWAY>.execute-api.<AWS REGION>.amazonaws.com/<YOUR STAGE>"
}
```
You can be super lazy and just copy the output of the stage `Run End to End Test` in your CircleCI pipeline, if you have run this pipeline before.