export const SUMMARY_PROMPT = `
# PRIMARY INSTRUCTION:
What is 1) the main thesis or point in this content and 2) what is each important point, question, or idea? Please use concise bullet points. Start the first bullet with "The overall main point or is".
## EXCEPTION
If, and only if, the content is a hacker news discussion thread, then:
1) provide a bullet list starting with a statement of the content the discussion thread is about including a link if possible
2) Use the second bullet to provide an overall summary of the points of view, including any major controversies or areas of consensus
3) then provide a bullet point for every useful, interesting, insightful, or otherwise noteworthy comment, including the username of the commenter. Be somewhat concise, however, maintain the essence of what is being said.
5) if the content is not specifically a hacker news, discussion thread, then apply the instruction stated under the header # PRIMARY INSTRUCTION and NOT under the subheader ## EXCEPTION
`;

export const SYNTHESIS_PROMPT = `
for this next instruction, you must take into account every single point raised in each of the two pieces of content you been provided and be sure to bring them all to the fore.

Also, do a deep and wide nice job synthesizing everything into the narrative that flows, because I'm going to turn this from text to speech and I need to be able to listen to it and know what going on and have a really good informative and enjoyable listening experience.

Ok. Here the big instruction:
---
- [ ] Great! Now let's come at this another way. What I want you to do is identify every clear assertion, (eg every idea, perspective, objections, or even a question). Then I want you to state each of those as an affirmative clear sentence in ## header size two. Prepend the words "TOPIC FOLLOWS" before each such topic title. These are the Topics.
- [ ] Start your response with a descriptive top level headline that encapsulates the thrust of this entire content.
- [ ] Then I want you to write clear bullet points under each one of those level 2 topic headers for every point that was made in any content (articles, comments, etc) on that topic. Make sure you capture the essence of the point that was made, and don't summarize it to the point that I don't really understand what was being said. I want to understand what each of these key points is. If there are points that don't fit under a topic add them after the topics under a topic titled "MISC Topics".
- [ ] When we are done, we will have covered the water front of all the vantage points and even the debates or dialogue that went back-and-forth that have transpired. But you will do it in a narrative arc that we can really understand through these affirmative statements and summary bullet points. You will tell the story!
- [ ] If there is BOTH a hacker news thread and also an article then: Include attribution for each of these bullet points to either the article or to the username in the hacker news thread or otherwise, as is appropriate. For each bullet start with "According to the Article:" or "According to Hacker News User [username]:" so it's easy for me to know what's the source while I'm listening to the text to speech version. If the source is neither an article not hacker news thread just use the best term.
- [ ] Be quite complete. Don't leave out ANY TOPIC OR PERSOECTIVE. Be verbose so as to gather all the relevant Information. I do not need you to be concise for this. I do want the whole story in this format.
- [ ] At the VERY END, include a "## level 2"" header titled PROVENANCE followed by bullets for all the key provenance or attribution type info for the article that you can see, so I can find it again, just as the title, the author, the publication, crucially THE URL, and include the URL of the hacker News thread if there is a hackerNews part of this task.
`;