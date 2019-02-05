ifeq ($(CIRCLE_BRANCH), master)
	DEPLOY_ENV=stable
else
	DEPLOY_ENV=unstable
endif

# CIRCLE CI RECIPES -------------------------------------------------
export DYNAMODB_TABLE_NAME=$(DEPLOY_ENV)-dictbot-table-cr
export S3_DEFINITION_BUCKET_NAME=$(DEPLOY_ENV)-dictbot-bucket-cr
export FROM_MAKEFILE=circleci

deploy:
	echo $(DYNAMODB_TABLE_NAME)
	echo $(S3_DEFINITION_BUCKET_NAME)
	sls deploy --stage $(DEPLOY_ENV)

seed:
	aws s3 cp ./assets/exampleDictionary.json s3://$(S3_DEFINITION_BUCKET_NAME)

# LOCAL RECIPES -----------------------------------------------------

deploy-local:
	DYNAMODB_TABLE_NAME=local-giuse-dictbot-table \
	S3_DEFINITION_BUCKET_NAME=local-giuse-dictbot-bucket \
	FROM_MAKEFILE=local \
	sls deploy --stage local
seed-local:
	aws s3 cp ./assets/exampleDictionary.json s3://$(S3_DEFINITION_BUCKET_NAME)