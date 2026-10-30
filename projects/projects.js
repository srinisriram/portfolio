import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('h1.projects-title');
projectsTitle.textContent = `${projects.length} Total Projects`

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let colors = d3.scaleOrdinal(d3.schemeTableau10);

let selectedYear = '';

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  
  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));
  
  // clear up paths and legends

  let newSVG = d3.select('#projects-pie-plot');
  newSVG.selectAll('path').remove()
  let legend = d3.select('.legend');
  legend.selectAll('li').remove()

  function toggleYear(label){
        selectedYear = selectedYear === label ? '' : label;

        newSVG
        .selectAll('path')
        .attr('class', (_, i) => (
            newData[i].label === selectedYear ? 'selected': ''
        ));
        
        legend
        .selectAll('li')
        .attr('class',  (_, i) => (
            newData[i].label === selectedYear ? 'legend-item selected' : 'legend-item'
        ));

        if (selectedYear !== ''){
            let filteredYearProjects = projectsGiven.filter((project) => project.year === selectedYear)
            renderProjects(filteredYearProjects, projectsContainer, 'h2');
        }
        else {
            renderProjects(projectsGiven, projectsContainer, 'h2');
        }
  }

  // update paths and legends, refer to steps 1.4 and 2.2
  newArcs.forEach((arc, idx) => {
    newSVG
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(idx))
    .attr('class',  newData[idx].label === selectedYear ? 'selected': '')
    .on('click', () => {
        toggleYear(newData[idx].label);
    });
  
  });

  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
      .attr('class', newData[idx].label === selectedYear ? 'legend-item selected' : 'legend-item')
      .on('click', () => {
        toggleYear(newData[idx].label);
      })
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
  });
}

renderPieChart(projects);

let query = '';

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  // update query value
  query = event.target.value;
  // filter projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  if (selectedYear !== ''){
    let filteredYearProjects = filteredProjects.filter((project) => project.year === selectedYear)
    renderProjects(filteredYearProjects, projectsContainer, 'h2');
  }
  else {
    renderProjects(filteredProjects, projectsContainer, 'h2');
  }
  // render filtered projects and pie chart
  renderPieChart(filteredProjects);
});

