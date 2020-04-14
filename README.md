# HuntURL
> During my internship at Microsoft, I did a side project. This is the blog website. The main service of this website is that it can recommend the similar url to user based on user's description in the post.  

## Motivation
> I want to improve my web development with node.js using MVC architecture and familiar with mongoose and middleware usage. There are multiple Azure services on top of this website, representing my familiarity with Azure PaaS and having some practical capabilities. Through this project I was also exposed to python, implement crawling, data processing, and also use multiprocess and multithread to improve the efficiency.
>
> ### Azure Services I used in this project
>  - Azure Blob Storage using sas token
>  - Azure Function app to implement background work
>  - Azure Batch service to improve the efficiency
>  - Azure Cosmos DB to store the data
>  - Azure Web App to carry website
>  - Azure DevOps to control the development process
>  - Azure Translator Text API

## Website features
> Sometimes I search the problem on google, but there is a problem I have no idea with related keyword. Therefore, I want to implement a new searching style. That is using user's browsing history. (Of course, it's important to ask the user for consent) User can contribute their history to this website, and post their problems to search their wanted url. Even though they don't know the keyword, they can try to descript the situation. This website will find the similar content of all the urls from all users  and recommend to you.<br>

## Website Architecture
![image](https://github.com/LOTINGYI/Learning-route/blob/master/public/images/github/Tim_Side_Project_2.jpg)

## The flow under the hood
> ### Data process(Background job)
> Step1: User upload their history data <br>
> Step2: Clean the data and upload to blob storage<br>
> Step3: Blob Trigger function app <br>
> Step4-1: Split the file <br>
> Step4-2: Create the batch pool (nodes based on the file size) <br>
> Step4-3: Create the job and define the task (scrape whole url in file)<br>
> Step5: Get the specific file and load it to the specific node <br>
> Step6: Start to run the task (Use the portal to observe the status)<br>
> Step7: After completing task, the scraped file will be stored in the blob<br>
> Step8: Blob Trigger function app <br>
> Step9: Clean the data and store the data into the destination <br>
> 
> <strong>Note: From step4-2 to step6 using azure batch service with multiprocess and multithread to speed up the scraping</strong>

> ### Recommend service
> Step1: User search the similar url based on their description<br>
> Step2: Call API from flask host<br>
> Step3: Get the data from the source, and process<br>
> Step4: Response to node.js web app <br>
> Step5: Store the recommend result to database
> Res: User get the result