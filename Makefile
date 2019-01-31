ifeq ($(CIRCLE_BRANCH), master)
	DEPLOY_ENV=stable
else
	DEPLOY_ENV=unstable
endif

DYNAMODB_TABLE_NAME="$(DEPLOY_ENV)-dictbot-table"
S3_DEFINITION_BUCKET_NAME="$(DEPLOY_ENV)-dictbot-bucket"

deploy:
	sls deploy --stage $(DEPLOY_ENV)

seed:
	s3 cp ./assets/help.json s3://$(S3_DEFINITION_BUCKET_NAME)