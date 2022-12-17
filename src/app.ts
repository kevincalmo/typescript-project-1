// Code goes here!

interface Draggable {
    dragStartHandler(event: DragEvent): void
    dragEndHandler(event: DragEvent): void
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void
    dropHandler(event: DragEvent): void
    dragLeaveHandler(event: DragEvent): void
}

enum ProjectStatus { Active, Finished }
class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: ProjectStatus
    ) {

    }
}

//custom type listener
type Listener<T> = (items: T[]) => void

class State<T> {
    protected listeners: Listener<T>[] = []

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}

//project state management class
class ProjectState extends State<Project> {

    private projects: any[] = [];
    private static instance: ProjectState;

    private constructor() {
        super();
    }

    static getInstance() {
        if (this.instance) {
            return this.instance
        }
        this.instance = new ProjectState();
        return this.instance;
    }



    addProject(
        title: string,
        description: string,
        numOfPeople: number
    ) {
        const newProject = new Project(
            Math.random().toString(),
            title,
            description,
            numOfPeople,
            ProjectStatus.Active)
        this.projects.push(newProject);
        this.updatedListener()
    }

    moveProject(
        projectId: string,
        newStatus: ProjectStatus
    ) {
        const project = this.projects.find(prj => prj.id === projectId)
        if (project && project.status !== newStatus) {
            project.status = newStatus
            this.updatedListener()
        }
    }

    private updatedListener() {
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

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T
    element: U

    constructor(
        templateId: string,
        hostElement: string,
        insertAtStart: boolean,
        newElementId?: string,

    ) {
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement
        this.hostElement = document.getElementById(hostElement)! as T
        const importNode = document.importNode(this.templateElement.content, true)// je récupère le contenu du template
        this.element = importNode.firstElementChild as U
        if (newElementId) this.element.id = newElementId
        this.attach(insertAtStart);
    }

    private attach(insertAtStart: boolean) {
        this.hostElement.insertAdjacentElement(
            insertAtStart ? 'afterbegin' : 'beforeend',
            this.element);
    }

    abstract configure(): void;
    abstract renderContent(): void;
}

class ProjectItem
    extends Component<HTMLUListElement, HTMLLIElement>
    implements Draggable {

    private project: Project;

    get persons() {
        if (this.project.people === 1) {
            return ' 1 person'
        } else {
            return `${this.project.people} persons`
        }
    }
    constructor(hostId: string, project: Project) {
        super('single-project', hostId, false, project.id);
        this.project = project
        this.configure()
        this.renderContent()
    }
    @AutoBind
    dragStartHandler(event: DragEvent): void {
        event.dataTransfer!.setData('text/plain', this.project.id)
        event.dataTransfer!.effectAllowed = 'move'
    }

    dragEndHandler(_: DragEvent): void {
        console.log('dragEnd');
    }

    configure() {
        this.element.addEventListener('dragstart', this.dragStartHandler)
        this.element.addEventListener('dragend', this.dragEndHandler)
    }

    renderContent() {
        this.element.querySelector('h2')!.textContent = this.project.title
        this.element.querySelector('h3')!.textContent = this.persons + ' assingned'
        this.element.querySelector('p')!.textContent = this.project.description
    }

}

class ProjectList
    extends Component<HTMLDivElement, HTMLElement>
    implements DragTarget {
    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished') {
        super('project-list', 'app', false, `${type}-projects`)
        this.assignedProjects = []
        this.configure()
        this.renderContent()
    }
    private renderProjetcs() {
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement
        listEl.innerHTML = ''
        for (const prjItem of this.assignedProjects) {
            /* const listItem = document.createElement('li')
            listItem.textContent = prjItem.title;
            listEl.appendChild(listItem) */
            new ProjectItem(this.element.querySelector('ul')!.id, prjItem)
        }
    }
    @AutoBind
    dragOverHandler(event: DragEvent): void {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault()
            const listEl = this.element.querySelector('ul')!;
            listEl.classList.add('droppable')
        }
    }
    @AutoBind
    dropHandler(event: DragEvent): void {
        const prjId = event.dataTransfer!.getData('text/plain')
        projectState.moveProject(
            prjId,
            this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished
        )

    }
    @AutoBind
    dragLeaveHandler(_: DragEvent): void {
        const listEl = this.element.querySelector('ul')!;
        listEl.classList.remove('droppable')
    }

    configure() {
        this.element.addEventListener('dragover', this.dragOverHandler)
        this.element.addEventListener('dragleave', this.dragLeaveHandler)
        this.element.addEventListener('drop', this.dropHandler)
        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter(project => {
                if (this.type === 'active') {
                    return project.status === ProjectStatus.Active
                }
                return project.status === ProjectStatus.Finished
            })
            this.assignedProjects = relevantProjects
            this.renderProjetcs()
        });
    }

    renderContent() {
        const listId = `${this.type}-projects-list`
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
    }
}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {

    titleInputElement: HTMLInputElement
    descriptionInputElement: HTMLInputElement
    peopleInputElement: HTMLInputElement

    constructor() {
        super('project-input', 'app', true, 'user-input');
        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement
        this.configure()
    }

    configure() {
        this.element.addEventListener('submit', this.submitHandler)
    }

    renderContent() { }

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
}

const prjInput = new ProjectInput();
const activeProjectList = new ProjectList('active')
const finishedProjectList = new ProjectList('finished')