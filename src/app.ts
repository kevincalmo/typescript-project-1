// Code goes here!


//project state management class
class ProjectState {
    private listeners: any = []
    private projects: any[] = [];
    private static instance: ProjectState;

    private constructor() {

    }

    static getInstance() {
        if (this.instance) {
            return this.instance
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addListener(listenerFn: Function) {
        this.listeners.push(listenerFn);
    }

    addProject(
        title: string,
        description: string,
        numOfPeople: number
    ) {
        const newProject = {
            id: Math.random().toString(),
            title,
            description,
            people: numOfPeople

        }
        this.projects.push(newProject);
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}

const projectState = ProjectState.getInstance();

//validation interface
interface validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

//validation function
function validate(validateInput: validatable) {
    let isValid = true;
    if (validateInput.required) {
        isValid = isValid && validateInput.value.toString().trim().length !== 0;
    }
    if (validateInput.minLength != null && typeof validateInput.value === 'string') {
        isValid = isValid && validateInput.value.length >= validateInput.minLength;
    }
    if (validateInput.maxLength != null && typeof validateInput.value === 'string') {
        isValid = isValid && validateInput.value.length <= validateInput.maxLength;
    }
    if (validateInput.min != null && typeof validateInput.value === 'number') {
        isValid = isValid && validateInput.value >= validateInput.min
    }
    if (validateInput.max != null && typeof validateInput.value === 'number') {
        isValid = isValid && validateInput.value <= validateInput.max
    }
    return isValid;
}


//autobind decorator
function AutoBind(_: any, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjContructor: PropertyDescriptor = {
        configurable: true,
        enumerable: false,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    }
    return adjContructor;
}

class ProjectList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement
    element: HTMLElement
    assignedProjects: any[];

    constructor(private type: 'active' | 'finished') {
        this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement
        this.hostElement = document.getElementById('app')! as HTMLDivElement
        this.assignedProjects = []

        const importNode = document.importNode(this.templateElement.content, true)// je récupère le contenu du template
        this.element = importNode.firstElementChild as HTMLElement
        this.element.id = `${this.type}-projects`

        projectState.addListener((projects: any[]) => {
            this.assignedProjects = projects
            this.renderProjetcs()
        });

        this.attach();
        this.renderContent()
    }
    private renderProjetcs() {
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement
        for (const prjItem of this.assignedProjects) {
            const listItem = document.createElement('li')
            listItem.textContent = prjItem.title;
            listEl.appendChild(listItem)
        }
    }

    private renderContent() {
        const listId = `${this.type}-projects-list`
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
    }

    private attach() {
        this.hostElement.insertAdjacentElement('beforeend', this.element);
    }
}

class ProjectInput {

    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement
    element: HTMLFormElement
    titleInputElement: HTMLInputElement
    descriptionInputElement: HTMLInputElement
    peopleInputElement: HTMLInputElement

    constructor() {
        this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement
        this.hostElement = document.getElementById('app')! as HTMLDivElement

        const importNode = document.importNode(this.templateElement.content, true)// je récupère le contenu du template
        this.element = importNode.firstElementChild as HTMLFormElement
        this.element.id = 'user-input'

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement

        this.configue()
        this.attach()
    }

    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = +this.peopleInputElement.value;

        const titleValidatable: validatable = {
            value: enteredTitle,
            required: true
        }
        const descriptionValidatable: validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        }
        const peopleValidatable: validatable = {
            value: enteredPeople,
            required: true,
            min: 1
        }
        if (
            validate(titleValidatable) &&
            validate(descriptionValidatable) &&
            validate(peopleValidatable)
        ) {
            return [enteredTitle, enteredDescription, enteredPeople];
        } else {
            alert('Invalid input, please try again !')
        }


    }

    private clearInput(): void {
        this.titleInputElement.value = ''
        this.descriptionInputElement.value = ''
        this.peopleInputElement.value = ''
    }

    @AutoBind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput()
        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;
            projectState.addProject(title, description, people)
            this.clearInput();
        }
    }

    private configue() {
        this.element.addEventListener('submit', this.submitHandler)
    }

    private attach() {
        this.hostElement.insertAdjacentElement('afterbegin', this.element)
    }
}

const prjInput = new ProjectInput();
const activeProjectList = new ProjectList('active')
const finishedProjectList = new ProjectList('finished')