# app.post('addRecipe'):
Positive Case:

- Description: Check if everything that needs to be inputted such as name, description, difficulty, time, ingredients, instructions are all inputted correctly.

- Input: Chicken Broth, This is Chicken Broth, 1, 1hr to 2hr, Chicken and Water, put Chicken into water boom!
- Expected result: Status 201, rendering /recipe and recipe sucessfully created
- Description of Result: A successful status (201) confirms the page is rendered

Negative Case:

- Description: Check what happens if some inputs are missing
- Input: Chicken Broth, This is Chicken Broth, 1, 1hr to 2hr
- Expected Result: Status 500, JSON response with an error message.
- Description of Result: status (500) confirms that no or not enough data was provided

TEST DATA:
- Positive Input: Chicken Broth, This is Chicken Broth, 1, 1hr to 2hr, Chicken and Water, put Chicken into water boom!
- Negative Input:  Chicken Broth, This is Chicken Broth, 1, 1hr to 2hr

Description of Test Data:
using table named recipes to address correct number of inputs

Test Environment:
Localhost

Expected Result:
- Positive Case: status 201
- Negative Casee: status 500

UAT: Ensuring that correct amount of input leads to a 201, but not enough input will return an error.





# app.get('/cookbook'):

TEST PLAN:  one positive and one negative

- Positive: Checking correct input. If the cookbookId field of the query is a valid cookbook owned by the current user, then the status should be 200.

- Negative: Checking invalid input. If the cookbookId field of the query is a not a valid cookbook or it is not owned by the current user, then the status should be 404.

Specific test case: 
cookbookId=1 and cookbookId=99999999999. The first will be used for positive case to check if it exist, and second will be used for negative case. Because we are testing on localhost, we will not add enough test cases for this to be a valid id.

Description of the test data:
We are using the cookbooks and cookbook_owners tables from our db. We can use this to ensure that the user can only view cookbooks that they created and own. cookbookId is a query perameter in the get request.

Environment: localhost

Expected results that will be used for this plan:
- Positive: status 200
- Negative: status 404

description of result:
- status 200: website successfully rendered
- status 404: cookbook not found

UAT: validate both successful cookbook queries and error handling for non existing entries.




# app.post('addCookbook'):
Positive Case:

- Description: Check if cookbook name is inputted correctly.

- Input: name="myCookbook"
Expected result: Status 201, redirecting to /myCookbooks
Description of Result: A successful status (201) confirms the page is rendered

Negative Case:

- Description: Check what happens if name is blank or missing
- Input: name=""
- Expected Result: Status 500, JSON response with an error message.
- Description of Result: status (500) confirms that no data was provided

TEST DATA:
- Positive Input: name="myCookbook"
- Negative Input:  name=""

Description of Test Data:
These are query perameters in the get request.

Test Environment:
Localhost

Expected Result:
- Positive Case: status 201
- Negative Casee: status 500

UAT: validate both successful cookbook creations and error handling when input is not valid.