// Runs under Chrome developer console as an authenticated user of Udemy
// and have the access to the scraping course.

// TODO: 
// 1. Assignment(type=practice) not supported yet
// 2. Promotional video

// Find the course ID first
const COURSE_ID = 852060;

// Do not touch this URLs unless they are changed.
const COURSE_INTRO_JSON_URL = `/api-2.0/courses/${COURSE_ID}/?fields[course]=title,headline,description,prerequisites,objectives,target_audiences`
const CURRICULUM_JSON_URL = `/api-2.0/courses/${COURSE_ID}/subscriber-curriculum-items/?page_size=1000&fields[lecture]=title,description,object_index,is_published,sort_order,created,asset,supplementary_assets,is_free&fields[quiz]=title,object_index,is_published,sort_order,type,num_assessments&fields[practice]=title,object_index,is_published,sort_order&fields[chapter]=title,object_index,is_published,sort_order&fields[asset]=title,filename,asset_type,status,time_estimation,is_external&caching_intent=True`;
const ATTACHMENT_JSON_URL = `/api-2.0/users/me/subscribed-courses/${COURSE_ID}/lectures/LECTURE_ID/supplementary-assets/ASSET_ID/?fields[asset]=download_urls`
const ARTICLE_JSON_URL = '/api-2.0/assets/ASSET_ID/?fields[asset]=@min,status,delayed_asset_message,processing_errors,body';
const VIDEO_DOWNLOADABLE_PATCH_URL = `/api-2.0/users/me/taught-courses/${COURSE_ID}/lectures/LECTURE_ID/?fields[lecture]=is_downloadable`;
const VIDEO_DOWNLOAD_URL = `/api-2.0/users/me/subscribed-courses/${COURSE_ID}/lectures/LECTURE_ID/?fields[lecture]=asset&fields[asset]=download_urls`
const TRANSCRIPT_FETCH_URL = `/api-2.0/users/me/subscribed-courses/${COURSE_ID}/lectures/LECTURE_ID/?fields[lecture]=asset,description,download_url,is_free,last_watched_second&fields[asset]=asset_type,length,media_license_token,course_is_drmed,media_sources,captions,thumbnail_sprite,slides,slide_urls,download_urls,external_url`
const QUIZ_DOWNLOAD_URL = `/api-2.0/quizzes/QUIZ_ID/assessments/?page_size=250&fields[assessment]=assessment_type,prompt,correct_response,section,original_assessment_id&draft=true`

// Default output is JSON
// Curriculum and supplements can be outputted as CSV
const OUTPUT_CSV = false;

// Logged in as student is needed
const DOWNLOAD_INTRODUCTION = true;
const DOWNLOAD_CURRICULUM = true;

const DOWNLOAD_SUPPLEMENT = true;        // Main toggle for attachment, article, video, quiz

const DOWNLOAD_ARTICLE = true;           // as student 
const DOWNLOAD_ATTACHMENT = true;        // as student
const DOWNLOAD_VIDEO = false;             // as instructor
const DOWNLOAD_TRANSCRIPT = false;        // as student
const DOWNLOAD_AUTO_TRANSLATED = false;   // as student
const DOWNLOAD_QUIZ = true;               // as instructor

const SOURCE_TRANSCRIPT_LOCALE = "en_US";
const AUTO_TRANSLATED_LOCALE = "zh_CN";

let downloadRequests = [];

const processCSV = (data, filename) => {
  const convertToCSV = (data) => {
    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        const escapedValue = (value !== null && value !== undefined) ?
          value.toString().replace(/"/g, '\\"') : '';
        return `"${escapedValue}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  const downloadCSV = (csvData, filename) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    downloadRequests.push({ url: url, filename: filename });
  };

  const csvData = convertToCSV(data);
  downloadCSV(csvData, filename);
}

const fetchCourseIntro = async (url) => {
  return fetch(url)
    .then(response => response.json())
    .then(data => {
      let item = {
        id: data.id,
        title: data.title,
        description: data.description,
        headline: data.headline,
        prerequisites: data.prerequisites,
        objectives: data.objectives,
        target_audiences: data.target_audiences,
      }
      return item;
    })
    .catch(error => {
      console.error('Error fetching course intro:', error);
    });
}

const fetchCurriculum = async (url) => {
  return fetch(url)
    .then(response => response.json())
    .then(data => {
      let results = data.results;
      let items = [];

      results.forEach(result => {
        let item = {
          type: result._class,
          id: result.id,
          title: result.title,
          description: null,
          quizNum: null,
          assetType: null,
          assetId: null,
          assetTitle: null,
          assetTime: null,
          supAssetCount: null,
        }
        // TODO: escape for being included in CSV
        if ('description' in result) {
          item.description = result.description;
        }

        if (item.type === 'quiz') {
          item.quizNum = result.num_assessments;
        }

        if ('asset' in result) {
          item.assetType = result.asset.asset_type;
          item.assetId = result.asset.id;
          item.assetTitle = result.asset.title;
          if (item.assetType === 'Video') {
            item.assetTime = result.asset.time_estimation;
          }
        }

        if ('supplementary_assets' in result) {
          item.supAssetCount = result.supplementary_assets.length;
        }
        items.push(item)
      });
      return items;
    })
    .catch(error => {
      console.error('Error fetching course curriculum:', error);
    });
}

const fetchSupplement = async (url) => {
  return fetch(url)
    .then(response => response.json())
    .then(data => {
      let results = data.results;
      let items = [];

      results.forEach(result => {
        let item = {
          lectureId: result.id,
          assetType: null,
          assetId: null,
          assetFilename: null,
        }
        if ('asset' in result) {
          if (result.asset.asset_type === 'Article') {
            item.assetType = result.asset.asset_type;
            item.assetId = result.asset.id;
            item.assetFilename = item.assetId + '.html';
            items.push(item)
          } else if (result.asset.asset_type === 'Video') {
            item.assetType = result.asset.asset_type;
            item.assetId = result.asset.id;
            item.assetFilename = result.asset.filename;
            items.push(item)
          }
        }
        if ('supplementary_assets' in result) {
          result.supplementary_assets.forEach(supItem => {
            item.assetType = supItem.asset_type;
            item.assetId = supItem.id;
            item.assetFilename = supItem.filename;

            let duplicated = false;
            items.forEach(i => {
              if (i.assetType === item.assetType &&
                i.lectureId === item.lectureId &&
                i.assetId === item.assetId) {
                duplicated = true;
              }
            })

            if (!duplicated && supItem.asset_type === 'File') {
              items.push(item);
            }
          })
        }
      });

      return items;
    })
    .catch(error => {
      console.error('Error fetching supplement:', error);
    });
}

const unescapeHtml = (html) => {
  const element = document.createElement('div');
  element.innerHTML = html;
  return element.innerHTML;
}

const createStringAsFile = (text) => {
  const blob = new Blob([text], { type: 'text/plain' });
  return url = URL.createObjectURL(blob);
}

const downloadArticle = async (id, filename) => {
  const url = ARTICLE_JSON_URL.replace('ASSET_ID', id);
  console.log("downloading article", id)

  return fetch(url)
    .then(response => response.json())
    .then(data => {
      downloadRequests.push({
        url: createStringAsFile(unescapeHtml(data.body)),
        filename: filename
      })
    })
    .catch(error => {
      console.error('Error fetching article:', error);
    });
}

const downloadSupplement = async (lid, aid, filename) => {
  const url = ATTACHMENT_JSON_URL.replace('LECTURE_ID', lid).replace('ASSET_ID', aid);

  return fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      if ("File" in data.download_urls && data.download_urls.File.length > 0) {
        let url = data.download_urls.File[0].file;
        downloadRequests.push({ url: url, filename: filename });
      }
    })
    .catch(error => {
      console.error('Error fetching file:', error);
    });
}

const downloadFilesSequentially = (reqs) => {
  console.log('Start downloading %d files.', reqs.length);

  if (reqs.length === 0) {
    console.log('All files downloaded successfully.');
    return;
  }

  const req = reqs.shift();
  downloadFile(req.url, req.filename)
    .then(() => {
      console.log(req);
      downloadFilesSequentially(reqs);
    })
    .catch(error => {
      console.error(`Error downloading file: ${req}`, error);
      downloadFilesSequentially(reqs);
    });
}

const downloadFile = (url, filename) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.onload = function() {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        resolve();
      } else {
        reject(new Error('Download failed'));
      }
    };
    xhr.onerror = function() {
      reject(new Error('Download failed'));
    };
    xhr.send();
  });
}

const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const downloadVideo = async (lectureId, filename) => {
  const url = VIDEO_DOWNLOADABLE_PATCH_URL.replace("LECTURE_ID", lectureId);

  return fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ is_downloadable: true })
  })
    .then(response => {
      if (response.ok) {
        console.log('Video ', lectureId, ' downloadable set to true.');
        const url = VIDEO_DOWNLOAD_URL.replace("LECTURE_ID", lectureId);
        return delay(1000).then(() => fetch(url).then(response => {
          if (response.ok) {
            response.json().then(data => {
              if ("asset" in data &&
                "download_urls" in data.asset &&
                "Video" in data.asset.download_urls) {
                const video = data.asset.download_urls.Video.find(item => item.label === "480");
                console.log("video: ", video.file)
                downloadRequests.push({ url: video.file, filename: filename });
              }
            })
          }
        }))
      } else {
        console.log('Video ', lectureId, ' downloadable setting failed.');
      }
    })
    .finally(async () => {
      await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_downloadable: false })
      }).then(response => {
        if (response.ok) {
          console.log('Video ', lectureId, ' downloadable set to false.');
        } else {
          console.log('Video ', lectureId, ' downloadable setting failed.');
        }
      })
    });
}

const downloadTranscript = async (lectureId, filename) => {
  const url = TRANSCRIPT_FETCH_URL.replace("LECTURE_ID", lectureId);

  return fetch(url).then(response => {
    if (response.ok) {
      response.json().then(data => {
        if ("asset" in data && "captions" in data.asset) {
          const srcCaption = data.asset.captions.find((item) =>
            item.locale_id === SOURCE_TRANSCRIPT_LOCALE);
          if (srcCaption) {
            if (srcCaption.source === "auto") {
              console.log("This transcript is auto generated. lectureID: ", lectureId);
            }
            downloadRequests.push({ url: srcCaption.url, filename: `${filename}.src.vtt` });
          }
          if (DOWNLOAD_AUTO_TRANSLATED) {
            const dstCaption = data.asset.captions.find((item) =>
              item.locale_id === AUTO_TRANSLATED_LOCALE)
            if (dstCaption) {
              downloadRequests.push({ url: dstCaption.url, filename: `${filename}.dst.vtt` });
            }
          }
        }
      })
    } else {
      console.log("Transcript not found for lecture: ", lectureId);
    }
  })
}


if (DOWNLOAD_INTRODUCTION) {
  await fetchCourseIntro(COURSE_INTRO_JSON_URL).then(data => {
    downloadRequests.push({
      url: createStringAsFile(JSON.stringify(data)),
      filename: `introduction.json`
    });
  });
}

if (DOWNLOAD_CURRICULUM || DOWNLOAD_QUIZ) {
  await fetchCurriculum(CURRICULUM_JSON_URL).then(data => {
    if (OUTPUT_CSV) {
      processCSV(data, `curriculum.csv`);
    }
    if (DOWNLOAD_CURRICULUM)
      downloadRequests.push({
        url: createStringAsFile(JSON.stringify(data)),
        filename: `curriculum.json`
      });

    if (DOWNLOAD_QUIZ) {
      const promises = [];
      data.forEach((item) => {
        if (item.type === "quiz") {
          promises.push(fetch(QUIZ_DOWNLOAD_URL.replace("QUIZ_ID", item.id)).then(response => {
            if (response.ok) {
              response.json().then(data => {
                downloadRequests.push({
                  url: createStringAsFile(JSON.stringify(data)),
                  filename: `quiz_${item.id}.json`
                });
              })
            } else {
              console.log("Fetching quiz failed: ", item.id)
            }
          }))
        }
      })
      return Promise.all(promises)
    }
  });
}

if (DOWNLOAD_SUPPLEMENT) {
  await fetchSupplement(CURRICULUM_JSON_URL).then(items => {
    if (OUTPUT_CSV) {
      processCSV(items, `supplement.csv`)
    }
    downloadRequests.push({
      url: createStringAsFile(JSON.stringify(items)),
      filename: `supplement.json`
    });

    const promises = [];

    items.forEach(item => {
      if (DOWNLOAD_SUPPLEMENT && DOWNLOAD_ARTICLE && item.assetType === 'Article')
        promises.push(downloadArticle(item.assetId, `${item.assetId}.html`));
      else if (DOWNLOAD_SUPPLEMENT && DOWNLOAD_ATTACHMENT && item.assetType === 'File')
        promises.push(downloadSupplement(
          item.lectureId,
          item.assetId,
          item.assetFilename));
      else if (DOWNLOAD_SUPPLEMENT && item.assetType === 'Video') {
        if (DOWNLOAD_VIDEO)
          promises.push(downloadVideo(item.lectureId, item.assetFilename))
        if (DOWNLOAD_TRANSCRIPT)
          promises.push(downloadTranscript(item.lectureId, item.assetFilename))
      }
    });

    return Promise.all(promises);
  })
}

downloadFilesSequentially(downloadRequests);
