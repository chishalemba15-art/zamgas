
import json

with open('current_task_def.json', 'r') as f:
    data = json.load(f)

td = data['taskDefinition']

new_td = {
    'family': td['family'],
    'executionRoleArn': td['executionRoleArn'],
    'networkMode': td['networkMode'],
    'containerDefinitions': td['containerDefinitions'],
    'volumes': td['volumes'],
    'placementConstraints': td['placementConstraints'],
    'requiresCompatibilities': td['requiresCompatibilities'],
    'cpu': td['cpu'],
    'memory': td['memory']
}

if 'taskRoleArn' in td:
    new_td['taskRoleArn'] = td['taskRoleArn']

# Update image to latest version
for container in new_td['containerDefinitions']:
    if container['name'] == 'zamgas-container':
        container['image'] = '296093722884.dkr.ecr.eu-west-2.amazonaws.com/zamgas:v32'
        
        # Note: Google OAuth credentials should be added via AWS ECS console
        # or AWS Secrets Manager, not hardcoded here
        # Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL

with open('new_task_def.json', 'w') as f:
    json.dump(new_td, f, indent=4)

print("Created new_task_def.json with image tag v32")


