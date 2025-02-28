const questions = {
    mathematics: [
        {
            category: 'mathematics',
            difficulty: 'easy',
            leftConcept: "Basic Arithmetic",
            rightConcept: "Complex Calculus",
            correctPosition: 20,
            timeLimit: 30,
            description: "Rate the complexity level of mathematical operations"
        },
        {
            category: 'mathematics',
            difficulty: 'medium',
            leftConcept: "Concrete Math Examples",
            rightConcept: "Abstract Math Concepts",
            correctPosition: 65,
            timeLimit: 30,
            description: "Balance between practical examples and theoretical concepts"
        },
        {
            category: 'mathematics',
            difficulty: 'hard',
            leftConcept: "Computational Math",
            rightConcept: "Theoretical Math",
            correctPosition: 80,
            timeLimit: 30,
            description: "Compare computational vs theoretical approaches"
        }
    ],
    science: [
        {
            category: 'science',
            difficulty: 'easy',
            leftConcept: "Observable Phenomena",
            rightConcept: "Abstract Theories",
            correctPosition: 40,
            timeLimit: 30,
            description: "Balance between observable science and theoretical concepts"
        },
        {
            category: 'science',
            difficulty: 'medium',
            leftConcept: "Classical Physics",
            rightConcept: "Quantum Physics",
            correctPosition: 75,
            timeLimit: 30,
            description: "Compare classical and quantum physics concepts"
        },
        {
            category: 'science',
            difficulty: 'hard',
            leftConcept: "Earth Science",
            rightConcept: "Space Science",
            correctPosition: 60,
            timeLimit: 30,
            description: "Rate the scale of scientific phenomena"
        }
    ],
    language: [
        {
            category: 'language',
            difficulty: 'easy',
            leftConcept: "Basic Vocabulary",
            rightConcept: "Advanced Literature",
            correctPosition: 30,
            timeLimit: 30,
            description: "Rate the complexity of language usage"
        },
        {
            category: 'language',
            difficulty: 'medium',
            leftConcept: "Grammar Rules",
            rightConcept: "Creative Writing",
            correctPosition: 50,
            timeLimit: 30,
            description: "Balance between technical rules and creative expression"
        },
        {
            category: 'language',
            difficulty: 'hard',
            leftConcept: "Literal Meaning",
            rightConcept: "Figurative Language",
            correctPosition: 70,
            timeLimit: 30,
            description: "Compare literal and figurative language usage"
        }
    ],
    history: [
        {
            category: 'history',
            difficulty: 'easy',
            leftConcept: "Recent Events",
            rightConcept: "Ancient History",
            correctPosition: 85,
            timeLimit: 30,
            description: "Rate historical events by time period"
        },
        {
            category: 'history',
            difficulty: 'medium',
            leftConcept: "Local History",
            rightConcept: "World History",
            correctPosition: 70,
            timeLimit: 30,
            description: "Compare local and global historical impact"
        },
        {
            category: 'history',
            difficulty: 'hard',
            leftConcept: "Historical Facts",
            rightConcept: "Historical Interpretation",
            correctPosition: 55,
            timeLimit: 30,
            description: "Balance between factual history and interpretation"
        }
    ]
};

function getRandomQuestions(count, category = null, difficulty = null) {
    let availableQuestions = [];
    
    if (category) {
        availableQuestions = questions[category] || [];
    } else {
        availableQuestions = Object.values(questions).flat();
    }

    if (difficulty) {
        availableQuestions = availableQuestions.filter(q => q.difficulty === difficulty);
    }

    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getCategories() {
    return Object.keys(questions);
}

function getDifficulties() {
    return ['easy', 'medium', 'hard'];
}

module.exports = {
    getRandomQuestions,
    getCategories,
    getDifficulties
}; 