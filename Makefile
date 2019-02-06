deploy-local:
	DYNAMODB_TABLE_NAME=local-giuse-dictbot-table \
	S3_DEFINITION_BUCKET_NAME=local-giuse-dictbot-bucket \
	FROM_MAKEFILE=local \
	sls deploy --stage local
seed-local:
	S3_DEFINITION_BUCKET_NAME=local-giuse-dictbot-bucket \
	aws s3 cp ./assets/data/data.json s3://$(S3_DEFINITION_BUCKET_NAME)