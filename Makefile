ifeq ($(CIRCLE_BRANCH), master)
	DEPLOY_ENV=stable
else
	DEPLOY_ENV=unstable
endif

# CIRCLE CI RECIPES
export DYNAMODB_TABLE_NAME="$(DEPLOY_ENV)-dictbot-table"
export S3_DEFINITION_BUCKET_NAME="$(DEPLOY_ENV)-dictbot-bucket"

deploy:
	sls deploy --stage $(DEPLOY_ENV)

seed:
	aws s3 cp ./assets/help.json s3://$(S3_DEFINITION_BUCKET_NAME)

# LOCAL RECIPES
export DYNAMODB_TABLE_NAME=local-giuse-dictbot-table
export S3_DEFINITION_BUCKET_NAME=local-giuse-dictbot-bucket
export FROM_MAKEFILE=local

deploy-local:
	echo $(DYNAMODB_TABLE_NAME)
	echo $(S3_DEFINITION_BUCKET_NAME)
	sls deploy --stage local
seed-local:
	aws s3 cp ./assets/help.json s3://$(S3_DEFINITION_BUCKET_NAME)