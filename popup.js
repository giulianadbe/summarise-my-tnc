// import {TextRank} from 'node_modules/textrank/index.js';
/*
 ==========================================
 TextRank: Bringing Order into Texts

 Performs sentence extraction only.
 Used for automatic article summarization.
 ==========================================
*/
// Article is a string of text to summarize
function textrank(article, settings) {

    this.printError = function (msg) {
      console.log("TextRank ERROR:", msg);
    }
  
    if(typeof article != "string") {
      this.printError("Article Must Be Type String");
      return;
    }
  
    if(article.length < 1){
      this.printError("Article Can't Be Empty");
      return;
    }
  
    if(!settings){
      settings = {};
    }
  
    this.extractAmount = (settings["extractAmount"])? settings["extractAmount"] : 5;
  
    // Random surfer model, used in the similarity scoring function
    this.d = (settings["d"])? settings["d"] : 0.85;
  
    // Set the similarity function for edge weighting
    this.userDefinedSimilarity = (settings["sim"])? settings["sim"] : null;
  
    // Tokens are a sentence [ sentence1, sentence2, sentence3, ... , sentenceN ]
    this.userDefinedTokens = (settings["tokens"])? settings["tokens"]: null;
    // Split are the sentences tokenized into words [[word1, word2, ... , wordN],[word1, word2, ... , wordN], ..., [word1, word2, ... , wordN]]
    this.userDefinedTokensSplit = (settings["split"])? settings["split"]: null;
  
    this.typeOfSummary = (settings["summaryType"])? 1 : 0;
  
    this.graph = {
      V: {}, // Sentences are the vertices of the graph
      E: {},
      numVerts: 0
    }
  
    this.summarizedArticle = "";
  
    // convergence threshold
    this.delta = 0.0001
  
    // Constructs the graph
    this.setupGraph = function (article) {
  
      // The TextPreprocesser cleans up and tokenizes the article
      this.graph.V = TextPreprocesser(article, this.userDefinedTokens, this.userDefinedTokensSplit);
  
      this.graph.numVerts = Object.keys(this.graph.V).length;
  
      // Check for user defined similarity function
      this.sim = (this.userDefinedSimilarity != null)? this.userDefinedSimilarity : this.similarityScoring;
  
      // Init vertex scores
      for(iIndex in this.graph.V) {
        var vertex = this.graph.V[iIndex];
  
        // The initial score of a vertex is random and does not matter for the TextRank algorithm
        vertex["score"] = Math.random() * 10 + 1;
  
        // Id is the sentence position starting from 0
        vertex["id"] = Number(iIndex);
  
        var Si = vertex;
  
        // Add an edge between every sentence in the graph
        // Fully connected graph
        for (var j = 0; j < this.graph.numVerts; j++) {
  
          var jIndex = j.toString();
  
          // No self edges
          if(jIndex != iIndex) {
  
            // If no edge list, create it
            if(!this.graph.E[iIndex]) {
              this.graph.E[iIndex] = {};
            }
  
            var Sj = this.graph.V[jIndex];
  
            // Compute the edge weight between two sentences in the graph
            this.graph.E[iIndex][jIndex] = this.sim(Si, Sj);
  
          }
        }
      }
    }
  
    // Given two sentences compute a score which is the weight on the edge between the two sentence
    // Implementation of Similarity(Si, Sj) function defined in the paper
    this.similarityScoring = function (Si, Sj) {
  
      var overlap = {}
      var Si_tokens = Si.tokens;
      var Sj_tokens = Sj.tokens;
  
      // Count words for sentence i
      for(var i = 0; i < Si_tokens.length; i++) {
        var word = Si_tokens[i];
  
        if(!overlap[word]) {
          overlap[word] = {}
        }
  
        overlap[word]['i'] = 1;
      }
  
      // Count words for sentence j
      for(var i = 0; i < Sj_tokens.length; i++) {
        var word = Sj_tokens[i];
  
        if(!overlap[word]) {
          overlap[word] = {}
        }
        overlap[word]['j'] = 1;
      }
  
      var logLengths = Math.log(Si_tokens.length) + Math.log(Sj_tokens.length);
      var wordOverlapCount = 0;
  
      // Compute word overlap from the sentences
      for( index in overlap) {
        var word = overlap[index]
        if ( Object.keys(word).length === 2) {
          wordOverlapCount++;
        }
      }
  
      // Compute score
      return wordOverlapCount/logLengths;
    }
  
    this.iterations = 0;
    this.iterateAgain = true;
  
    // The Weighted Graph WS(Vi) function to score a vertex
    this.iterate = function () {
  
      for(index in this.graph.V){
  
        var vertex = this.graph.V[index];  // Vi vertex
        var score_0 = vertex.score;
  
        var vertexNeighbors = this.graph.E[index]; // In(Vi) set
  
        var summedNeighbors = 0;
  
        // Sum over In(Vi)
        for (neighborIndex in vertexNeighbors) {
  
          var neighbor = vertexNeighbors[neighborIndex]; // Vj
  
          var wji = this.graph.E[index][neighborIndex]; // wji
  
          // Sum over Out(Vj)
          var outNeighbors = this.graph.E[neighborIndex];
          var summedOutWeight = 1; // Stores the summation of weights over the Out(Vj)
  
          for( outIndex in outNeighbors) {
            summedOutWeight += outNeighbors[outIndex];
          }
  
          var WSVertex = this.graph.V[neighborIndex].score; // WS(Vj)
          summedNeighbors += (wji/summedOutWeight) * WSVertex;
  
        }
  
        var score_1 = (1 - this.d) + this.d * summedNeighbors; // WS(Vi)
  
        // Update the score on the vertex
        this.graph.V[index].score = score_1;
  
        // Check to see if you should continue
        if(Math.abs(score_1 - score_0) <= this.delta) {
          this.iterateAgain = false;
        }
  
      }
  
      // Check for another iteration
      if(this.iterateAgain == true) {
        this.iterations += 1;
        this.iterate();
      }else {
  
        // Prints only once
        // console.log(this.iterations);
      }
  
      return;
    }
  
    // Extracts the top N sentences
    this.extractSummary = function (N) {
  
      var sentences = [];
  
      // Graph all the sentences
      for ( index in this.graph.V) {
        sentences.push(this.graph.V[index]);
      }
  
      // Sort the sentences based off the score of the vertex
      sentences = sentences.sort( function (a,b) {
        if (a.score > b.score) {
          return -1;
        }else {
          return 1;
        }
      });
  
      // Grab the top N sentences
      // var sentences = sentences.slice(0,0+(N));
      sentences.length = N;
  
      // Sort based of the id which is the position of the sentence in the original article
      sentences = sentences.sort(function (a,b) {
        if (a.id < b.id) {
          return -1;
        } else {
          return 1;
        }
      })
  
      var summary = null;
  
      if(this.typeOfSummary) {
        summary = [];
        for (var i = 0; i < sentences.length; i++) {
          summary.push(sentences[i].sentence);
        }
  
      } else {
        // Compose the summary by joining the ranked sentences
        var summary = sentences[0].sentence;
  
        for (var i = 1; i < sentences.length; i++) {
          summary += " " + sentences[i].sentence;
        }
  
      }
  
      return summary;
    }
  
    this.run =  function (article) {
      // Create graph structure
      this.setupGraph(article);
  
      // Rank sentences
      this.iterate();
  
      this.summarizedArticle = this.extractSummary(this.extractAmount);
    }
  
    this.run(article);
  }
  
  // Handles the preprocessing of text for creating the graph structure of TextRank
  function TextPreprocesser(article, userTokens, userTokensSplit) {
  
    // Fucntion to clean up anything with the article that is passed in.
    this.cleanArticle = function (article) {
  
      // Regex to remove two or more spaces in a row.
      return article.replace(/[ ]+(?= )/g, "");
  
    }
  
    // tokenizer takes a string {article} and turns it into an array of sentences
    // tokens are sentences, must end with (!?.) characters
    this.tokenizer = function(article) {
  
      return article.replace(/([ ][.A-Za-z-|0-9)]+[!|.|?| ](?=[ ]+[A-Z]))/g, "$1|").split("|").filter((sentence) => sentence.length < 300);
    }
  
    // Cleans up the tokens
    // tokens are sentences
    this.cleanTokens = function(tokens) {
  
      // Iterate backwards to allow for splicing.
      for (var i = tokens.length - 1; i >= 0; i--) {
  
        // Current Token
        var token = tokens[i]
  
        // Empty String
        if(token == "") {
          tokens.splice(i,1);
        }else { // Since string is not empty clean it up
  
          // Remove all spaces leading the sentence
          tokens[i] = token.replace(/[ .]*/,"")
        }
      }
  
      return tokens;
    }
  
    // given a sentence, split it up into the amount of words in the sentence
    this.tokenizeASentence = function(sentence) {
  
      // lowercase all the words in the sentences
      var lc_sentence = sentence.toLowerCase();
  
      /*
      Regex Expression Below :
      Example: cool, awesome, something else, and yup
      The delimiters like commas (,) (:) (;)  etc ... need to be removed
      When scoring sentences against each other you do not want to compare
      {cool,} against {cool} because they will not match since the comma stays with {cool,}
      */
  
      // put spaces between all characters to split into words
      var replaceToSpaceWithoutAfterSpace = /[-|'|"|(|)|/|<|>|,|:|;](?! )/g;
      lc_sentence = lc_sentence.replace(replaceToSpaceWithoutAfterSpace," ");
  
      // Now replace all characters with blank
      var replaceToBlankWithCharacters = /[-|'|"|(|)|/|<|>|,|:|;]/g;
      lc_sentence = lc_sentence.replace(replaceToBlankWithCharacters,"");
  
      // Split into the words based off spaces since cleaned up
      return lc_sentence.split(" ");
    }
  
    this.outputPreprocess = function(article) {
  
      var cleanedArticle = this.cleanArticle(article);
  
      // Check for user tokens
      var usingUserDefinedTokens = (userTokens && userTokensSplit);
      var tokens = (usingUserDefinedTokens)? userTokens : this.cleanTokens(this.tokenizer(cleanedArticle));
  
      var output = {};
  
      for (var i = 0; i < tokens.length; i++) {
  
        var tokenizedSentence = (usingUserDefinedTokens)? userTokensSplit[i]: this.tokenizeASentence(tokens[i]);
  
        output[i] = {
          sentence: tokens[i],
          tokens: tokenizedSentence
        };
  
      }
  
      return output;
    }
  
    return this.outputPreprocess(article);
  }
  
chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    // get current website url 
    let tab = tabs[0];
    let url = new URL(tab.url);
    var domain = url.hostname;
    var website = document.getElementById('website');

    // fetch the html from the website
    fetch(url).then(function (response) {
        // The API call was successful!
        return response.text();
    }).then(function (data) {
        // search for the <footer> tag 
        var parser = new DOMParser();
        var doc = parser.parseFromString(data, 'text/html');
        var footer = doc.querySelector('footer');
        var box = document.getElementById('box');

        // search for the <a> tag with the terms & conditions in footer
        // get href values in the footer
        let array = [];
        let links = footer.getElementsByTagName("a");
        for (var i=0, max=links.length; i<max; i++) {
            array.push(links[i].href);
        }

        // try match regex for selected keywords
        let regexList = [/term/, /condition/, /legal/, /agreement/]; // do research here
        let matches = [];
        array.forEach((link) => {
            matches = regexList.filter((word) => word.test(link.toLowerCase()));
            if (matches.length === 0) {
                console.log("No matches");
            } else {
                // chrome://extension
                // or new
                let termsLink;
                if (link.split('/')[0] === 'chrome-extension:') {
                    let content = link.split('/');
                    content.shift();
                    content.shift();
                    content.shift();
                    termsLink = 'https://' + domain + '/' + content.join('/');
                } else {
                    termsLink = link;
                }
                box.textContent = termsLink;
                // output match
                fetch(termsLink).then(function (response) {
                    return response.text();
                }).then(function (data) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(data, 'text/html');
                    var body = doc.querySelector('body');
                    var main = body.querySelector('main');
                    //var all = document.querySelectorAll("p, h1, h2, h3, h4, h5, h6");
                    var summary = document.getElementById('summary');
                    //var textRank = new textrank(main.textContent);
                    var textRank = new textrank(main.textContent, {extractAmount:3});
                    var firstSummary = textRank.summarizedArticle;
                    // textRank = new textrank(firstSummary);
                    // var secondSummary = textRank.summarizedArticle;
                    //summary.textContent = main.textContent;
                    summary.textContent = firstSummary;
                }).catch(function(err) {
                    console.warn('Something went wrong.', err);
                });

                return;
            }
        });

        // var articleOfText = "On Monday, the TSA announced a peculiar new security measure to take effect within 96 hours. Passengers flying into the US on foreign airlines from eight Muslim countries would be prohibited from carrying aboard any electronics larger than a smartphone. They would have to be checked and put into the cargo hold. And now the UK is following suit. It's difficult to make sense of this as a security measure, particularly at a time when many people question the veracity of government orders, but other explanations are either unsatisfying or damning. So let's look at the security aspects of this first. Laptop computers aren't inherently dangerous, but they're convenient carrying boxes. This is why, in the past, TSA officials have demanded passengers turn their laptops on: to confirm that they're actually laptops and not laptop cases emptied of their electronics and then filled with explosives. Forcing a would-be bomber to put larger laptops in the plane's hold is a reasonable defense against this threat, because it increases the complexity of the plot. Both the shoe-bomber Richard Reid and the underwear bomber Umar Farouk Abdulmutallab carried crude bombs aboard their planes with the plan to set them off manually once aloft. Setting off a bomb in checked baggage is more work, which is why we don't see more midair explosions like Pan Am Flight 103 over Lockerbie, Scotland, in 1988. Security measures that restrict what passengers can carry onto planes are not unprecedented either. Airport security regularly responds to both actual attacks and intelligence regarding future attacks. After the liquid bombers were captured in 2006, the British banned all carry-on luggage except passports and wallets. I remember talking with a friend who traveled home from London with his daughters in those early weeks of the ban. They reported that airport security officials confiscated every tube of lip balm they tried to hide. Similarly, the US started checking shoes after Reid, installed full-body scanners after Abdulmutallab and restricted liquids in 2006. But all of those measure were global, and most lessened in severity as the threat diminished. This current restriction implies some specific intelligence of a laptop-based plot and a temporary ban to address it. However, if that's the case, why only certain non-US carriers? And why only certain airports? Terrorists are smart enough to put a laptop bomb in checked baggage from the Middle East to Europe and then carry it on from Europe to the US. Why not require passengers to turn their laptops on as they go through security? That would be a more effective security measure than forcing them to check them in their luggage. And lastly, why is there a delay between the ban being announced and it taking effect? Even more confusing, The New York Times reported that \"officials called the directive an attempt to address gaps in foreign airport security, and said it was not based on any specific or credible threat of an imminent attack.\" The Department of Homeland Security FAQ page makes this general statement, \"Yes, intelligence is one aspect of every security-related decision,\" but doesn't provide a specific security threat. And yet a report from the UK states the ban \"follows the receipt of specific intelligence reports.\" Of course, the details are all classified, which leaves all of us security experts scratching our heads. On the face of it, the ban makes little sense. One analysis painted this as a protectionist measure targeted at the heavily subsidized Middle Eastern airlines by hitting them where it hurts the most: high-paying business class travelers who need their laptops with them on planes to get work done. That reasoning makes more sense than any security-related explanation, but doesn't explain why the British extended the ban to UK carriers as well. Or why this measure won't backfire when those Middle Eastern countries turn around and ban laptops on American carriers in retaliation. And one aviation official told CNN that an intelligence official informed him it was not a \"political move.\" In the end, national security measures based on secret information require us to trust the government. That trust is at historic low levels right now, so people both in the US and other countries are rightly skeptical of the official unsatisfying explanations. The new laptop ban highlights this mistrust.";
        // var textRank = new textrank(articleOfText);
        // var summary = document.getElementById('summary');
        // summary.textContent = textRank.summarizedArticle;
    }).catch(function(err) {
        console.warn('Something went wrong.', err);
    });
});
