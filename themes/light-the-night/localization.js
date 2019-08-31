module.exports = {
	content: {
		indexH1: 'Light the Night',
		indexH2: 'When we walk, cancer runs.',
		walkHeading: 'Find a Salesforce Walk',
		donateHeading: 'Fundraising Progress',
		learnHeading: 'About Light the Night',
	},
	contestTableRowCellsToShow: [
		9, 8, 7, 6
	],
	contestTableHeaderNamesMappedToMasterDataHeaderNames: {
		"UUID": "UUID",
		"Team Name": "Team Name",
		"Chapter": "Chapter",
		"Walkside UUID2": "Walkside UUID2",
		"Goal": "",
		"Total Raised": "",
		"Walk Date": "Walk Date",
		"Number of Walkers": "Participants",
		"City": "City",
		"State": "State",
		"Postal Code": "Postal Code",
	},
	contestData: [] // Gets filled in at the top of app.js
};
