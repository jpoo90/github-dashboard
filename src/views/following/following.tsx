import * as React from 'react';
import RepositoriesTable from '../../components/repositories-table/repositories-table';
import { connect } from 'react-redux';
import { Credentials, CredentialsInterface } from '../../services/credentials';
import { GithubApi, GithubIssuesInterface, GithubRepoInterface } from '../../services/github-api';
import { GITHUB_STORE_ACTIONS } from '../../stores/github-store';

function mapStateToProps(state) {
  return {
    repositories: state.userSubscriptions,
    hasMoreRepos: state.hasMoreRepos,
    nextReposUrl: state.nextReposUrl
  };
}

//TODO change use any, any to use types
class Following extends React.Component<any, any> {
  private credentials: CredentialsInterface;
  private githubApi: any;

  constructor(props) {
    super(props);

    this.credentials = new Credentials().getCredentials();
    this.githubApi = new GithubApi(this.credentials);
    this.state = {
      repositories: [],
      hasMoreRepos: false,
      nextReposUrl: ''
    };

    this.getUserSubscriptionsWithIssues();
  }

  private getUserSubscriptionsWithIssues(nextReposUrl?: string) {
    let dispatch = this.props.dispatch;
    this.githubApi.getUserSubscriptions(null, nextReposUrl).then((response: any) => {

      dispatch({
        type: GITHUB_STORE_ACTIONS.GET_NEXT_USER_SUBSCRIPTIONS,
        userSubscriptions: response.repos,
        hasMoreRepos: response.hasMoreRepos,
        nextReposUrl: response.nextReposUrl
      });

      //TODO move offsetIdx logic into a central place
      response.repos.forEach((repo: GithubRepoInterface, index: number) => {
        let offsetIdx = nextReposUrl ? (this.state.repositories.length - 30) + index : index;

        this.githubApi.getIssuesForRepository(repo.details.name, repo.details.owner.login).then((response: GithubIssuesInterface) => {
          dispatch({
            type: GITHUB_STORE_ACTIONS.GET_ISSUES_FOR_USER_SUBSCRIPTION,
            index: offsetIdx,
            issues: response
          });
        })
      })
    });
  }

  componentWillReceiveProps(nextProps) {
    //console.log('nextProps', nextProps);
    this.setState({
      repositories: nextProps.repositories || [],
      hasMoreRepos: nextProps.hasMoreRepos,
      nextReposUrl: nextProps.nextReposUrl
    });
  }

  //this is here since if a component isnt mounted when dispatches to the store happen
  //the component will need to manually query the store to hydrate itself into state
  componentWillMount() {
    this.setState({
      repositories: this.props.repositories,
      hasMoreRepos: this.props.hasMoreRepos,
      nextReposUrl: this.props.nextReposUrl
    });
  }

  render() {
    return (
      <div>
        <h3>Subscribed Repositories</h3>
        <RepositoriesTable
          repositories={this.state.repositories}
          hasMoreRepos={this.state.hasMoreRepos}
          nextReposUrl={this.state.nextReposUrl}
          getNextRepos={this.getUserSubscriptionsWithIssues.bind(this)}
        />
      </div>
    )
  }

}

export default connect(mapStateToProps)(Following);