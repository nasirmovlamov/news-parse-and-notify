const { Notifier } = require("@indutny/simple-windows-notifications");

const notifier = new Notifier("news");

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { Notification } = require("node-notifier");
const cheerio = require("cheerio");

// Define a function to send notifications to Windows

// Define a function to scrape the latest news and compare with the existing ones
async function fetchLatestNews() {
  let latestDate = null;
  const newsFilePath = path.join(__dirname, "news.json");

  // Read the existing news from the file
  if (fs.existsSync(newsFilePath)) {
    const existingNews = JSON.parse(fs.readFileSync(newsFilePath, "utf8"));
    // Get the latest date from the existing news
    if (existingNews && existingNews.length > 0) {
      latestDate = new Date(existingNews[0].date);
      existingNews.forEach((news) => {
        const currentDate = new Date(news.date);
        if (currentDate > latestDate) {
          latestDate = currentDate;
        }
      });
    }
  }

  try {
    // Send the HTTP request to get the latest news articles
    const response = await axios.get(
      "https://operativmedia.az/all_news?page=1"
    );

    const $ = cheerio.load(response.data); // Load the HTML response into Cheerio
    const newsList = [];

    const monthMap = {
      Yanvar: "January",
      Fevral: "February",
      Mart: "March",
      Aprel: "April",
      May: "May",
      İyun: "June",
      İyul: "July",
      Avqust: "August",
      Sentyabr: "September",
      Oktyabr: "October",
      Noyabr: "November",
      Dekabr: "December",
    };

    // Iterate through each news item and extract the required information
    $(".medium__banner").each(async (index, element) => {
      const title = $(element).find("strong.fs-6").text().trim();
      const imageUrl = $(element).find("img").attr("src");
      const date = $(element).find(".sub__title span").text().trim();
      const link = $(element).find("a.stretched-link").attr("href");

      // Extract day, month, year, and time from the date string
      const [day, monthAzeri, year, time] = date.split(/[\s,]+/);
      const month = monthMap[monthAzeri];
      const isoDate = new Date(`${month} ${day}, ${year} ${time}:00`);

      // Check if the article is newer than the latest saved date

      if (isoDate > latestDate) {
        notifier.show(
          `<toast duration="long">
                <visual>
                  <binding template="ToastText02">
                    <text id="1">${title}</text>
                  </binding>
                </visual>
                <actions>
                  <action
                    content="Read More"
                    arguments="${link}"
                    activationType="protocol" />
                </actions>
              </toast>`,
          { tag: `tag${title}`, group: "group" }
        );
        newsList.push({
          title,
          imageUrl,
          date: isoDate,
          link,
        });
      }
    });

    // If new articles are found, save them to the file and send a notification
    if (newsList.length > 0) {
      fs.writeFileSync(newsFilePath, JSON.stringify(newsList, null, 2));
    } else {
      console.log("New news not found!");
    }
  } catch (error) {
    console.error("Error fetching news:", error);
  }
}

// Set an interval to fetch news every 10 minutes (600,000 milliseconds)
// setInterval(fetchLatestNews, 600000);
setInterval(fetchLatestNews, 600000);

// Initial call to fetch the news immediately when the script starts
fetchLatestNews();
