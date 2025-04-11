# AccessFlow: Eye-Tracking Browser Extension for Accessibility
AccessFlow is a browser extension that enables hands-free web navigation using eye movements. By tracking the user’s gaze, it allows individuals with mobility impairments to interact with websites more easily. The extension converts eye gestures into actions such as scrolling and clicking, enhancing accessibility and providing an alternative navigation method.

This project explores the use of eye-tracking technology to enhance accessibility and social inclusion. The system leverages low-cost innovations to assist individuals with disabilities in interacting with digital interfaces more effectively.
# Features
- Eye Gesture Recognition: Navigate websites using eye movements.

- Hands-Free Web Navigation: Perform common actions like scrolling, clicking, and interacting without a mouse or keyboard.

- Cross-Browser Support: Works seamlessly on Chrome, Firefox, Edge, Opera, and Safari.

- Customisable Controls: Enable/disable eye tracking and adjust settings for gaze duration and gestures.

# How It Works
AccessFlow detects eye gestures through the webcam and translates them into actions on the webpage. Below are the main gestures it recognises:

- Look Left → Scroll Left

- Look Right → Scroll Right

- Look Up → Scroll Up

- Look Down → Scroll Down

- Fix Gaze → Click on buttons, links, or other clickable elements

This allows users to interact with websites by simply looking at different parts of the screen, making web navigation more accessible.

## Getting Started

This project is set up like a Chrome extension, but for now, you can just run it like a regular website to test everything out. Here’s how to get it running on your computer using a local server.

---

### What You’ll Need

You’ll need [Node.js](https://nodejs.org/) installed. It includes both `npm` and `npx`, so you don’t need to install those separately.

To check if it’s already installed, open your terminal and run:

```bash
node -v
npm -v
npx -v
```


### How to Install Node.js
On macOS (using Homebrew)
```bash
brew install node
```
On Ubuntu
```bash
sudo apt update
sudo apt install nodejs npm
```
On Windows
Go to https://nodejs.org/


Download the LTS version

Install it and then open a terminal

Check if it's working:

```bash
node -v
npm -v
npx -v
```



### Running the Project Locally
1. Clone the Repo
```
git clone https://github.com/aaryaabhaypatil/accessflow.git
```



### Start a Local Server
We’re going to use a tool called http-server to run the project locally.

In the terminal, run:

```
npx http-server
```
It will give you a local link like:

```
http://127.0.0.1:8080
```
or
```
http://localhost:8080
```


Now, when you open the link, it will display the project folder structure, and you should be able to click on the `frontend` folder and run the app.


