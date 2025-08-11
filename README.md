# Synthi — Your Personal Content Synthesizer

**[➡️ Try Synthi Live!](https://prototypejam.github.io/synthesize/)**

Synthi is a simple, powerful web utility designed to quickly summarize and synthesize web content, with a special focus on Hacker News discussions and their linked articles. It's a tool built to help you decide what's worth your time, get to the core ideas faster, and explore complex topics from multiple perspectives, even on the go.

## What Can You Do with Synthi?

Synthi is built around a workflow that I personally use every day. It supports several modes of analysis to fit different needs and a "hold-my-beer" mode lets you pop a Hacker News URL into the text box, click GO and get summaries of that discussion thread and the underlying article and a topic-based synthesis of all major points in BOTH the thread and the article. I'll write more aboout it [on my blog](https://www.dazzagreenwood.com), but for the moment, here's an overview: 

### ✨ Quick Summaries
Ever land on a Hacker News thread with 300+ comments and wonder if it's worth diving in? Synthi can give you the gist in seconds. For any article or discussion, you get a concise, bulleted summary covering:
*   The overall main point or thesis
*   The most prevalent supporting ideas, open questions, and takeaways
*   For Hacker News threads specifically, a high-level summary of the points of view, debates, areas of consensus, and a quick rundown of the insightful comments

### 🚀 The Smart HN Workflow
This is where Synthi really shines. Just paste a single Hacker News `item?id=...` URL, and the app instantly recognizes it, fetches the linked article, and presents you with a menu of options:
*   **Quick Summaries:** Get fast, parallel summaries of both the article and the discussion to quickly gauge the topic
*   **Article Only / Discussion Only:** Focus on just one source if you prefer
*   **Full Analysis:** The main event! This triggers the deep, high-quality summary and synthesis workflow

### 🎧 The Synthesis: Optimized for Listening
This is the feature I'm most excited about and the reason I built this tool. The "Full Analysis" option generates a unique synthesis that weaves together the content from the original article and the Hacker News discussion. It's designed specifically for text-to-speech, so you can listen to it while doing chores, commuting, or traveling.

*   **Grouped by Topic:** It identifies the key topics and groups all related points together, even if the comments were scattered across different parts of the thread
*   **Clear Attribution:** You'll always know the origin of a point. Each bullet starts with **"According to the Article:"** or **"According to Hacker News User [username]:"**, making the narrative easy to follow
*   **Discover the Narrative:** You get a clear arc of the main points, opposing views, and interesting rabbit holes, all in one cohesive story. It's a terrific way to broaden your horizons and expose yourself to diverse viewpoints on topics you might otherwise not have the time for. It's actually enjoyable!

---

## A Personal Note: Why I Built This

I created Synthi as a convenience for myself. I'm constantly finding interesting articles on Hacker News, but I don't always have time to read a 300-comment thread *and* a long article. This tool lets me quickly identify the core ideas and decide where to focus my attention.

The synthesis feature in particular has been incredibly valuable to me. I can queue up a few interesting topics and listen to them while I'm doing chores, shopping, or traveling. It's a fantastic way to make sure I'm being exposed to lots of different points of view.

This project was also a huge learning experience. My background is mostly in Python, so building a modern web app with **React, TypeScript, and Vite** was a new challenge. I relied extensively on AI coding assistants to help me navigate the world of frontend development, and I learned a great deal about putting together a web app, dealing with asynchronous issues, and making deliberate architectural choices.

One of the biggest lessons was in fetching web content. I started with a single proxy, which often failed. I upgraded to a pool of several proxies, which, haha, *still* failed more than I liked. This led me to set up a **Cloudflare Worker**. While I'm not completely comfortable relying on an external service for a static site that I want to be self-contained and immune to rot, at the end of the day, it's faster, more reliable, and a great learning experience. Given Cloudflare's position, I hope it will be stable for the foreseeable future, and I can always roll back to the proxy method if needed.

Ultimately, a major goal here was to keep the project **open web oriented**. It had to be a simple utility that could live at a URL. GitHub Pages is a great home for something like this, but it works anywhere that can host a static site. You can even run it on a Mac by just pointing a browser to the local `index.html` file, which is exactly how I believe the open web should work.

When I first made websites in the mid-1990s, I love pointing Mosaic, and then Netscape, browsers at my own local HTML files, which I used as a sort of mini, personal Yahoo directory (people of a certain vintage will know what I'm talking about!). It felt powerful to use a browser to cut across business and network boundaries, whether the resource was on my hard drive or a server across the world. Being able to access and share resources freely and immediately across business/organizational, legal/jurisdictional, and technical/network boundaries was a blast.  Building these little utilities feels fresh and new again, very much of the moment in the way things were easy to rapidly prototype and share back at the dawn of the web. I'm definitely a fan of this vibe and look forward to learning more as I build more.

---

## Run It Yourself

Want to run your own instance of Synthi? It's easy!

### Prerequisites
*   [Node.js](https://nodejs.org/) (LTS version)
*   A [Gemini API Key](https://aistudio.google.com/app/apikey) from Google AI Studio (free tier available)
*   A free [Cloudflare account](https://dash.cloudflare.com/sign-up)

### Step 1: Clone the Repository
```bash
git clone https://github.com/prototypejam/synthesize.git
cd synthesize
```

### Step 2: Set Up Your Cloudflare Worker (Critical!)
The app uses a worker to fetch URL content reliably. You **must** set up your own free worker to avoid being rate-limited when multiple people use mine.

1.  Log in to your [Cloudflare dashboard](https://dash.cloudflare.com)
2.  Navigate to **Workers & Pages**
3.  Click **Create Application** → **Create Worker**
4.  Name it something like `synthi-proxy` and click **Deploy**
5.  Click **Edit code** and replace everything with the `worker.js` code from this repository
6.  Click **Save and Deploy**
7.  Copy your worker's URL (looks like `https://synthi-proxy.yourname.workers.dev`)

### Step 3: Configure the App
Open `src/services/geminiService.ts` and replace the placeholder with your worker URL:
```typescript
const WORKER_BASE = "https://synthi-proxy.yourname.workers.dev";
```

### Step 4: Install & Run Locally
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser to `http://localhost:5173/synthesize/` and you're ready to go! The app will prompt you for your Gemini API key on first use.

### Deploy to GitHub Pages (Optional)
1.  Update `package.json` with your GitHub username:
    ```json
    "homepage": "https://YOUR_USERNAME.github.io/synthesize/"
    ```
2.  Build and deploy:
    ```bash
    npm run deploy
    ```

### Other Hosting Options
*   **Any static host:** Build with `npm run build` and upload the `dist` folder
*   **Run offline:** After building, you can open `dist/index.html` directly in your browser!

---

## Technical Stack

For those interested, Synthi is built with:
*   **React & TypeScript** for the UI
*   **Vite** for blazing-fast development
*   **Tailwind CSS** for styling
*   **Google's Gemini API** for AI-powered summaries
*   **Cloudflare Workers** for reliable content fetching
*   **GitHub Pages** for hosting

## License

MIT - Use this however you'd like! The code is yours to modify, extend, and make your own.

---

**Built with ❤️ for the open web**
